import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, User, AlertCircle, Plus, CheckCircle, XCircle, Bell } from "lucide-react";
import { format } from "date-fns";

interface WaitingListEntry {
  id: string;
  equipment_id: string;
  user_id: number;
  quantity_needed: number;
  preferred_date: string;
  preferred_start_time: string;
  preferred_end_time: string;
  purpose?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'waiting' | 'notified' | 'fulfilled' | 'cancelled';
  notified_at?: string;
  fulfilled_at?: string;
  notes?: string;
  created_at: string;
  user_name?: string;
  equipment_name?: string;
}

interface WaitingListManagerProps {
  equipmentId?: string;
  onEntryCreate?: () => void;
  currentUserId?: number;
}

export function WaitingListManager({ equipmentId, onEntryCreate, currentUserId }: WaitingListManagerProps) {
  const [entries, setEntries] = useState<WaitingListEntry[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [formData, setFormData] = useState({
    equipment_id: equipmentId || "",
    quantity_needed: 1,
    preferred_date: "",
    preferred_start_time: "09:00",
    preferred_end_time: "11:00",
    purpose: "",
    priority: "medium" as 'low' | 'medium' | 'high'
  });

  useEffect(() => {
    fetchData();
  }, [filterStatus, equipmentId]);

  const fetchData = async () => {
    try {
      const [entriesResponse, equipmentResponse] = await Promise.all([
        fetch(`http://localhost/labmate-guardian-main/api/waiting_list.php${equipmentId ? `?equipment_id=${equipmentId}` : ''}`),
        fetch("http://localhost/labmate-guardian-main/api/inventory_equipment.php")
      ]);

      const entriesData = await entriesResponse.json();
      const equipmentData = await equipmentResponse.json();

      setEntries(entriesData.entries || []);
      setEquipment(equipmentData.items || []);
    } catch (error) {
      console.error('Error fetching waiting list data:', error);
      toast.error("Failed to load waiting list data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost/labmate-guardian-main/api/waiting_list.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          user_id: currentUserId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Added to waiting list successfully");
        setOpen(false);
        setFormData({
          equipment_id: equipmentId || "",
          quantity_needed: 1,
          preferred_date: "",
          preferred_start_time: "09:00",
          preferred_end_time: "11:00",
          purpose: "",
          priority: "medium"
        });
        fetchData();
        onEntryCreate?.();
      } else {
        toast.error(result.error || "Failed to add to waiting list");
      }
    } catch (error) {
      console.error('Error creating waiting list entry:', error);
      toast.error("Failed to add to waiting list");
    }
  };

  const handleUpdateEntry = async (entryId: string, updates: any) => {
    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/waiting_list.php?id=${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success("Waiting list entry updated successfully");
        fetchData();
      } else {
        toast.error(result.error || "Failed to update entry");
      }
    } catch (error) {
      console.error('Error updating waiting list entry:', error);
      toast.error("Failed to update entry");
    }
  };

  const handleNotifyUser = async (entryId: string) => {
    await handleUpdateEntry(entryId, { 
      status: 'notified',
      notified_at: new Date().toISOString()
    });
  };

  const handleFulfillEntry = async (entryId: string) => {
    await handleUpdateEntry(entryId, { 
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString()
    });
  };

  const handleCancelEntry = async (entryId: string) => {
    await handleUpdateEntry(entryId, { status: 'cancelled' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-blue-100 text-blue-800';
      case 'notified': return 'bg-purple-100 text-purple-800';
      case 'fulfilled': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting': return <Clock className="w-4 h-4" />;
      case 'notified': return <Bell className="w-4 h-4" />;
      case 'fulfilled': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const filteredEntries = entries.filter(entry => {
    const matchesStatus = filterStatus === "all" || entry.status === filterStatus;
    return matchesStatus;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Equipment Waiting List
            </CardTitle>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Waiting List
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add to Waiting List</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateEntry} className="space-y-4">
                  {!equipmentId && (
                    <div>
                      <Label htmlFor="equipment_id">Equipment</Label>
                      <Select value={formData.equipment_id} onValueChange={(value) => setFormData(prev => ({ ...prev, equipment_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipment.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div>
                    <Label htmlFor="quantity_needed">Quantity Needed</Label>
                    <Input
                      id="quantity_needed"
                      type="number"
                      min="1"
                      value={formData.quantity_needed}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity_needed: parseInt(e.target.value) || 1 }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="preferred_date">Preferred Date</Label>
                    <Input
                      id="preferred_date"
                      type="date"
                      value={formData.preferred_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, preferred_date: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="preferred_start_time">Start Time</Label>
                      <Input
                        id="preferred_start_time"
                        type="time"
                        value={formData.preferred_start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferred_start_time: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="preferred_end_time">End Time</Label>
                      <Input
                        id="preferred_end_time"
                        type="time"
                        value={formData.preferred_end_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, preferred_end_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="purpose">Purpose</Label>
                    <Textarea
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                      placeholder="Describe why you need this equipment..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit">Add to Waiting List</Button>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="waiting">Waiting</SelectItem>
                <SelectItem value="notified">Notified</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading waiting list...</div>
          ) : filteredEntries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Equipment</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Preferred Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.equipment_name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {entry.user_name}
                        </div>
                      </TableCell>
                      <TableCell>{entry.quantity_needed}</TableCell>
                      <TableCell>
                        {format(new Date(entry.preferred_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {entry.preferred_start_time} - {entry.preferred_end_time}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(entry.priority)}>
                          {entry.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(entry.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(entry.status)}
                            {entry.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {entry.purpose || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {entry.status === 'waiting' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleNotifyUser(entry.id)}
                              >
                                Notify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleFulfillEntry(entry.id)}
                              >
                                Fulfill
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleCancelEntry(entry.id)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No waiting list entries found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
