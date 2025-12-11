import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, RefreshCw, Filter } from "lucide-react";
import { ReservationCalendar } from "@/components/ReservationCalendar";
import { WaitingListManager } from "@/components/WaitingListManager";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  created_at: string;
}

const Reservations = () => {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEquipment, setFilterEquipment] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  
  const { notifications, unreadCount, markAllAsRead, loadMoreNotifications, hasMoreNotifications, totalNotifications, removeNotification, clearAllNotifications } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || ""
  );

  const [formData, setFormData] = useState({
    status: "",
    rejection_reason: "",
    notes: ""
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterEquipment]);

  const fetchData = async () => {
    try {
      const [reservationsResponse, equipmentResponse] = await Promise.all([
        fetch("http://localhost/labmate-guardian-main/api/reservations.php"),
        fetch("http://localhost/labmate-guardian-main/api/inventory_equipment.php")
      ]);

      const reservationsData = await reservationsResponse.json();
      const equipmentData = await equipmentResponse.json();

      setReservations(reservationsData.reservations || []);
      setEquipment(equipmentData.items || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReservation = async (reservationId: string, updates: any) => {
    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/reservations.php?id=${reservationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Reservation updated successfully");
        fetchData();
        setOpen(false);
        setSelectedReservation(null);
      } else {
        toast.error(result.error || "Failed to update reservation");
      }
    } catch (error) {
      console.error('Error updating reservation:', error);
      toast.error("Failed to update reservation");
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    if (!confirm("Are you sure you want to delete this reservation?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/reservations.php?id=${reservationId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Reservation deleted successfully");
        fetchData();
      } else {
        toast.error(result.error || "Failed to delete reservation");
      }
    } catch (error) {
      console.error('Error deleting reservation:', error);
      toast.error("Failed to delete reservation");
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesStatus = filterStatus === "all" || reservation.status === filterStatus;
    const matchesEquipment = filterEquipment === "all" || reservation.equipment_id === filterEquipment;
    const matchesSearch = searchTerm === "" || 
      reservation.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.purpose?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesEquipment && matchesSearch;
  });

  const openUpdateDialog = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setFormData({
      status: reservation.status,
      rejection_reason: "",
      notes: ""
    });
    setOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;

    const updates: any = {
      status: formData.status
    };

    if (formData.status === 'rejected' && formData.rejection_reason) {
      updates.rejection_reason = formData.rejection_reason;
    }

    if (formData.notes) {
      updates.notes = formData.notes;
    }

    if (formData.status === 'approved' && currentUser?.role === 'admin') {
      updates.approved_by = currentUser.id;
    }

    handleUpdateReservation(selectedReservation.id, updates);
  };

  return (
    <div>
      <NavHeader 
        title="Equipment Reservations" 
        subtitle="Manage equipment reservations and waiting lists"
        showBackButton={true}
        showHomeButton={true}
      >
        <NotificationProfile 
          notifications={notifications}
          unreadCount={unreadCount}
          currentUser={currentUser}
          markAllAsRead={markAllAsRead}
          loadMoreNotifications={loadMoreNotifications}
          hasMoreNotifications={hasMoreNotifications}
          totalNotifications={totalNotifications}
          removeNotification={removeNotification}
          clearAllNotifications={clearAllNotifications}
        />
      </NavHeader>
      
      <div className="container mx-auto p-6 pt-20" style={{ transform: 'scale(0.74)', transformOrigin: 'top left', width: '120%' }}>
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-2">
            {currentUser?.role === 'admin' && (
              <Button onClick={() => setViewMode("calendar")}>
                Create Reservation
              </Button>
            )}
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              onClick={() => setViewMode("list")}
            >
              List View
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              onClick={() => setViewMode("calendar")}
            >
              Calendar View
            </Button>
          </div>
        </div>

        {viewMode === "calendar" ? (
          <ReservationCalendar 
            equipment={equipment}
            currentUserId={currentUser?.id}
            currentUserRole={currentUser?.role}
            onReservationCreate={fetchData}
          />
        ) : (
          <Tabs defaultValue="reservations" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="reservations">Reservations</TabsTrigger>
              <TabsTrigger value="waiting-list">Waiting List</TabsTrigger>
            </TabsList>

            <TabsContent value="reservations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Reservation Management
              </CardTitle>
              
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Search reservations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterEquipment} onValueChange={setFilterEquipment}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Equipment</SelectItem>
                    {equipment.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button onClick={fetchData} variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading reservations...</div>
              ) : filteredReservations.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Equipment</TableHead>
                        <TableHead className="w-[150px]">User</TableHead>
                        <TableHead className="w-[120px]">Date</TableHead>
                        <TableHead className="w-[140px]">Time</TableHead>
                        <TableHead className="w-[80px]">Quantity</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[200px]">Purpose</TableHead>
                        <TableHead className="w-[150px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReservations.map((reservation) => (
                        <TableRow key={reservation.id}>
                          <TableCell className="font-medium">
                            {reservation.equipment_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {reservation.user_name}
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(reservation.reservation_date), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {reservation.start_time} - {reservation.end_time}
                            </div>
                          </TableCell>
                          <TableCell>{reservation.quantity_reserved}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(reservation.status)}>
                              <div className="flex items-center gap-1">
                                {getStatusIcon(reservation.status)}
                                {reservation.status}
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {reservation.purpose || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {currentUser?.role === 'admin' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openUpdateDialog(reservation)}
                                  >
                                    Update
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteReservation(reservation.id)}
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No reservations found
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="waiting-list">
              <WaitingListManager 
                currentUserId={currentUser?.id}
                onEntryCreate={fetchData}
              />
            </TabsContent>
          </Tabs>
        )}

        {/* Update Reservation Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Reservation</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.status === 'rejected' && (
                <div>
                  <Label htmlFor="rejection_reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection_reason"
                    value={formData.rejection_reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, rejection_reason: e.target.value }))}
                    placeholder="Reason for rejection..."
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Update</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Reservations;
