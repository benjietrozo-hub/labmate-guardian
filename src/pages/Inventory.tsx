import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";

const Inventory = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  
  const { notifications, unreadCount, markAllAsRead } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || ""
  );
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    category: "",
    item_description: "",
    serial_number: "",
    quantity: "",
    purpose: "",
    date_returned: "",
    condition: "",
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/inventory_equipment.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch inventory");
      }

      setItems(result.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      
      const itemData = {
        ...formData,
        quantity: parseInt(formData.quantity),
        created_by: user?.id,
      };

      if (editingItem) {
        const response = await fetch(`http://localhost/labmate-guardian-main/api/inventory_equipment.php?id=${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update equipment");
        }
        toast.success("Equipment updated successfully");
      } else {
        const response = await fetch("http://localhost/labmate-guardian-main/api/inventory_equipment.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to add equipment");
        }
        toast.success("Equipment added successfully");
      }

      setOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to save equipment");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this equipment?")) return;

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/inventory_equipment.php?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete equipment");
      }
      toast.success("Equipment deleted successfully");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to delete equipment");
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      name: "",
      category: "",
      item_description: "",
      serial_number: "",
      quantity: "",
      purpose: "",
      date_returned: "",
      condition: "",
    });
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      date: item.date || "",
      name: item.name || "",
      category: item.category || "",
      item_description: item.item_description || "",
      serial_number: item.serial_number || "",
      quantity: item.quantity?.toString() || "",
      purpose: item.purpose || "",
      date_returned: item.date_returned || "",
      condition: item.condition || "",
    });
    setOpen(true);
  };

  return (
    <div>
      <NavHeader 
        title="Inventory" 
        subtitle="Manage equipment and supplies"
        showBackButton={true}
        showHomeButton={true}
      >
        <NotificationProfile 
          notifications={notifications}
          unreadCount={unreadCount}
          currentUser={currentUser}
          markAllAsRead={markAllAsRead}
        />
      </NavHeader>
      <div className="space-y-6 p-6">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingItem ? "Edit" : "Add"} Equipment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Recorded By *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="furniture">Furniture</SelectItem>
                        <SelectItem value="tools">Tools</SelectItem>
                        <SelectItem value="supplies">Supplies</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item_description">Item Description *</Label>
                    <Textarea
                    id="item_description"
                    value={formData.item_description}
                    onChange={(e) => setFormData({ ...formData, item_description: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purpose">Purpose</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_returned">Date Returned</Label>
                  <Input
                    id="date_returned"
                    type="date"
                    value={formData.date_returned}
                    onChange={(e) => setFormData({ ...formData, date_returned: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Input
                    id="condition"
                    value={formData.condition}
                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingItem ? "Update" : "Add"} Equipment
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No equipment found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.item_description}</TableCell>
                  <TableCell>{item.serial_number || "N/A"}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.condition || "N/A"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </div>
    </div>
  );
};

export default Inventory;
