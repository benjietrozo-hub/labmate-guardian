import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";

const BorrowItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    borrower_name: "",
    item: "",
    quantity: "",
    borrow_date: "",
    return_date: "",
    status: "Borrowed",
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/borrow_items.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch borrow records");
      }

      setItems(result.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch borrow records");
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
        const response = await fetch(`http://localhost/labmate-guardian-main/api/borrow_items.php?id=${editingItem.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update borrow record");
        }
        toast.success("Borrow record updated successfully");
      } else {
        const response = await fetch("http://localhost/labmate-guardian-main/api/borrow_items.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(itemData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to create borrow record");
        }
        toast.success("Borrow record created successfully");
      }

      setOpen(false);
      resetForm();
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to save borrow record");
    }
  };

  const handleReturn = async (id: string) => {
    try {
      const item = items.find((it) => it.id === id);
      if (!item) {
        throw new Error("Record not found");
      }

      const updateData = {
        borrower_name: item.borrower_name,
        item: item.item,
        quantity: item.quantity,
        borrow_date: item.borrow_date,
        return_date: item.return_date,
        status: "Returned",
      };

      const response = await fetch(`http://localhost/labmate-guardian-main/api/borrow_items.php?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update status");
      }
      toast.success("Item marked as returned");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(`api/borrow_items.php?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete record");
      }
      toast.success("Record deleted successfully");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to delete record");
    }
  };

  const resetForm = () => {
    setFormData({
      borrower_name: "",
      item: "",
      quantity: "",
      borrow_date: "",
      return_date: "",
      status: "Borrowed",
    });
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      borrower_name: item.borrower_name || "",
      item: item.item || "",
      quantity: item.quantity?.toString() || "",
      borrow_date: item.borrow_date || "",
      return_date: item.return_date || "",
      status: item.status || "Borrowed",
    });
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1 rounded border text-sm hover:bg-muted"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-3 py-1 rounded border text-sm hover:bg-muted"
          >
            Home
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Borrow Items</h1>
            <p className="text-muted-foreground">Manage equipment borrowing and returns</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Borrow
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit" : "New"} Borrow Record</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="borrower_name">Borrower Name *</Label>
                  <Input
                    id="borrower_name"
                    value={formData.borrower_name}
                    onChange={(e) => setFormData({ ...formData, borrower_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item">Item *</Label>
                  <Input
                    id="item"
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    required
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
                  <Label htmlFor="borrow_date">Borrow Date *</Label>
                  <Input
                    id="borrow_date"
                    type="date"
                    value={formData.borrow_date}
                    onChange={(e) => setFormData({ ...formData, borrow_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="return_date">Expected Return Date</Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => setFormData({ ...formData, return_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">{editingItem ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Borrower</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Borrow Date</TableHead>
              <TableHead>Expected Return</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No borrow records found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.borrower_name}</TableCell>
                  <TableCell>{item.item}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{new Date(item.borrow_date).toLocaleDateString()}</TableCell>
                  <TableCell>{item.return_date ? new Date(item.return_date).toLocaleDateString() : "N/A"}</TableCell>
                  <TableCell>
                    {item.status === "Returned" ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Returned
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Borrowed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {item.status === "Borrowed" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReturn(item.id)}
                        title="Mark as returned"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
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
  );
};

export default BorrowItems;
