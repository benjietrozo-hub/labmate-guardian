import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CalendarIcon, Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, addDays, setHours, setMinutes, isAfter, isBefore, isWithinInterval } from "date-fns";

interface Equipment {
  id: string;
  name: string;
  category: string;
  quantity: number;
  serial_number?: string;
}

interface Reservation {
  id: string;
  equipment_id: string;
  user_id: number;
  reservation_date: string;
  start_time: string;
  end_time: string;
  quantity_reserved: number;
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'completed';
  user_name?: string;
  equipment_name?: string;
}

interface ReservationCalendarProps {
  equipment: Equipment[];
  onReservationCreate?: (reservation: any) => void;
  currentUserId?: number;
}

export function ReservationCalendar({ equipment, onReservationCreate, currentUserId }: ReservationCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedEquipment, setSelectedEquipment] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    start_time: "09:00",
    end_time: "11:00",
    quantity: 1,
    purpose: ""
  });
  const [conflicts, setConflicts] = useState<string[]>([]);

  useEffect(() => {
    if (selectedEquipment && selectedDate) {
      fetchReservations();
    }
  }, [selectedEquipment, selectedDate]);

  const fetchReservations = async () => {
    if (!selectedEquipment || !selectedDate) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost/labmate-guardian-main/api/reservations.php?equipment_id=${selectedEquipment}&date=${format(selectedDate, 'yyyy-MM-dd')}`
      );
      const data = await response.json();
      setReservations(data.reservations || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkConflicts = () => {
    if (!selectedDate || !selectedEquipment) return;

    const newStart = setMinutes(setHours(selectedDate, parseInt(formData.start_time.split(':')[0])), parseInt(formData.start_time.split(':')[1]));
    const newEnd = setMinutes(setHours(selectedDate, parseInt(formData.end_time.split(':')[0])), parseInt(formData.end_time.split(':')[1]));

    const conflicts: string[] = [];
    
    reservations.forEach(reservation => {
      if (reservation.status === 'approved') {
        const resStart = setMinutes(setHours(selectedDate, parseInt(reservation.start_time.split(':')[0])), parseInt(reservation.start_time.split(':')[1]));
        const resEnd = setMinutes(setHours(selectedDate, parseInt(reservation.end_time.split(':')[0])), parseInt(reservation.end_time.split(':')[1]));

        // Check for time overlap
        if (
          (isAfter(newStart, resStart) && isBefore(newStart, resEnd)) ||
          (isAfter(newEnd, resStart) && isBefore(newEnd, resEnd)) ||
          (isBefore(newStart, resStart) && isAfter(newEnd, resEnd)) ||
          newStart.getTime() === resStart.getTime()
        ) {
          conflicts.push(`Time conflict with existing reservation from ${reservation.start_time} to ${reservation.end_time}`);
        }

        // Check quantity availability
        const totalReserved = reservations
          .filter(r => r.status === 'approved')
          .reduce((sum, r) => sum + r.quantity_reserved, 0);
        
        const equipmentItem = equipment.find(e => e.id === selectedEquipment);
        if (equipmentItem && totalReserved + formData.quantity > equipmentItem.quantity) {
          conflicts.push(`Insufficient quantity. Only ${equipmentItem.quantity - totalReserved} units available`);
        }
      }
    });

    setConflicts(conflicts);
  };

  useEffect(() => {
    checkConflicts();
  }, [formData.start_time, formData.end_time, formData.quantity, reservations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (conflicts.length > 0) {
      return;
    }

    try {
      const reservationData = {
        equipment_id: selectedEquipment,
        reservation_date: format(selectedDate!, 'yyyy-MM-dd'),
        start_time: formData.start_time,
        end_time: formData.end_time,
        quantity_reserved: formData.quantity,
        purpose: formData.purpose,
        user_id: currentUserId
      };

      const response = await fetch('http://localhost/labmate-guardian-main/api/reservations.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData)
      });

      const result = await response.json();
      
      if (result.success) {
        setOpen(false);
        setFormData({ start_time: "09:00", end_time: "11:00", quantity: 1, purpose: "" });
        fetchReservations();
        onReservationCreate?.(result.reservation);
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isDateUnavailable = (date: Date) => {
    // You can implement logic to disable past dates or other restrictions
    return isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Section */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Equipment Reservation Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select equipment" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.quantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button 
                    disabled={!selectedEquipment || !selectedDate}
                    className="whitespace-nowrap"
                  >
                    Make Reservation
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>New Reservation</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_time">Start Time</Label>
                        <Input
                          id="start_time"
                          type="time"
                          value={formData.start_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_time">End Time</Label>
                        <Input
                          id="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="1"
                        value={formData.quantity}
                        onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="purpose">Purpose</Label>
                      <Textarea
                        id="purpose"
                        value={formData.purpose}
                        onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                        placeholder="Brief description of how you'll use this equipment..."
                      />
                    </div>

                    {conflicts.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-red-600 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Conflicts Detected
                        </Label>
                        {conflicts.map((conflict, index) => (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            {conflict}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button type="submit" disabled={conflicts.length > 0}>
                        Create Reservation
                      </Button>
                      <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateUnavailable}
              className="rounded-md border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Reservations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'Select a date'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : reservations.length > 0 ? (
            <div className="space-y-3">
              {reservations.map((reservation) => (
                <div key={reservation.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className={getStatusColor(reservation.status)}>
                      {reservation.status}
                    </Badge>
                    <span className="text-sm text-gray-600">
                      Qty: {reservation.quantity_reserved}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    {reservation.start_time} - {reservation.end_time}
                  </div>
                  {reservation.user_name && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      {reservation.user_name}
                    </div>
                  )}
                  {reservation.purpose && (
                    <p className="text-sm text-gray-600">{reservation.purpose}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {selectedEquipment ? 'No reservations for this date' : 'Select equipment to view reservations'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
