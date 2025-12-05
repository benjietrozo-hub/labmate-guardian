import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";

const VisitorLogs = () => {
  const navigate = useNavigate();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingVisitor, setEditingVisitor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    purpose: "",
    date: "",
    time_in: "",
    time_out: "",
  });

  useEffect(() => {
    fetchVisitors();
  }, []);

  const fetchVisitors = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/visitor_logs.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch visitor logs");
      }

      setVisitors(result.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch visitor logs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      
      const visitorData = {
        ...formData,
        created_by: user?.id,
      };

      if (editingVisitor) {
        const response = await fetch(`http://localhost/labmate-guardian-main/api/visitor_logs.php?id=${editingVisitor.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(visitorData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update visitor log");
        }
        toast.success("Visitor log updated successfully");
      } else {
        const response = await fetch("http://localhost/labmate-guardian-main/api/visitor_logs.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(visitorData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to create visitor log");
        }
        toast.success("Visitor log created successfully");
      }

      setOpen(false);
      resetForm();
      fetchVisitors();
    } catch (error: any) {
      toast.error(error.message || "Failed to save visitor log");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this visitor log?")) return;

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/visitor_logs.php?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete visitor log");
      }
      toast.success("Visitor log deleted successfully");
      fetchVisitors();
    } catch (error: any) {
      toast.error("Failed to delete visitor log");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      purpose: "",
      date: "",
      time_in: "",
      time_out: "",
    });
    setEditingVisitor(null);
  };

  const handleEdit = (visitor: any) => {
    setEditingVisitor(visitor);
    setFormData({
      name: visitor.name || "",
      purpose: visitor.purpose || "",
      date: visitor.date || "",
      time_in: visitor.time_in || "",
      time_out: visitor.time_out || "",
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
            <h1 className="text-3xl font-bold tracking-tight">Visitor Logs</h1>
            <p className="text-muted-foreground">Record visitor information</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Visitor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingVisitor ? "Edit" : "New"} Visitor Log</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="name">Visitor Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="purpose">Purpose *</Label>
                  <Textarea
                    id="purpose"
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    required
                  />
                </div>
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
                  <Label htmlFor="time_in">Time In *</Label>
                  <Input
                    id="time_in"
                    type="time"
                    value={formData.time_in}
                    onChange={(e) => setFormData({ ...formData, time_in: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="time_out">Time Out</Label>
                  <Input
                    id="time_out"
                    type="time"
                    value={formData.time_out}
                    onChange={(e) => setFormData({ ...formData, time_out: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">{editingVisitor ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Visitor Name</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time In</TableHead>
              <TableHead>Time Out</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : visitors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No visitor logs found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              visitors.map((visitor) => (
                <TableRow key={visitor.id}>
                  <TableCell className="font-medium">{visitor.name}</TableCell>
                  <TableCell>{visitor.purpose}</TableCell>
                  <TableCell>{new Date(visitor.date).toLocaleDateString()}</TableCell>
                  <TableCell>{visitor.time_in}</TableCell>
                  <TableCell>{visitor.time_out || "Still in"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(visitor)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(visitor.id)}
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

export default VisitorLogs;
