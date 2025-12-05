import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CheckCircle } from "lucide-react";

const RepairMaintenance = () => {
  const navigate = useNavigate();
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingRepair, setEditingRepair] = useState<any>(null);
  const [formData, setFormData] = useState({
    date: "",
    equipment_name: "",
    serial_number: "",
    issue_description: "",
    action_taken: "",
    technician_name: "",
    status: "Pending",
  });

  useEffect(() => {
    fetchRepairs();
  }, []);

  const fetchRepairs = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/repair_maintenance.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch repair records");
      }

      setRepairs(result.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch repair records");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      
      const repairData = {
        ...formData,
        created_by: user?.id,
      };

      if (editingRepair) {
        const response = await fetch(`http://localhost/labmate-guardian-main/api/repair_maintenance.php?id=${editingRepair.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(repairData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update repair record");
        }
        toast.success("Repair record updated successfully");
      } else {
        const response = await fetch("http://localhost/labmate-guardian-main/api/repair_maintenance.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(repairData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to create repair record");
        }
        toast.success("Repair record created successfully");
      }

      setOpen(false);
      resetForm();
      fetchRepairs();
    } catch (error: any) {
      toast.error(error.message || "Failed to save repair record");
    }
  };

  const handleComplete = async (id: string) => {
    try {
      const repair = repairs.find((r) => r.id === id);
      if (!repair) {
        throw new Error("Repair record not found");
      }

      const updateData = {
        date: repair.date,
        equipment_name: repair.equipment_name,
        serial_number: repair.serial_number,
        issue_description: repair.issue_description,
        action_taken: repair.action_taken,
        technician_name: repair.technician_name,
        status: "Completed",
      };

      const response = await fetch(`http://localhost/labmate-guardian-main/api/repair_maintenance.php?id=${id}`, {
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
      toast.success("Repair marked as completed");
      fetchRepairs();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this repair record?")) return;

    try {
      const response = await fetch(`api/repair_maintenance.php?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete repair record");
      }
      toast.success("Repair record deleted successfully");
      fetchRepairs();
    } catch (error: any) {
      toast.error("Failed to delete repair record");
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      equipment_name: "",
      serial_number: "",
      issue_description: "",
      action_taken: "",
      technician_name: "",
      status: "Pending",
    });
    setEditingRepair(null);
  };

  const handleEdit = (repair: any) => {
    setEditingRepair(repair);
    setFormData({
      date: repair.date || "",
      equipment_name: repair.equipment_name || "",
      serial_number: repair.serial_number || "",
      issue_description: repair.issue_description || "",
      action_taken: repair.action_taken || "",
      technician_name: repair.technician_name || "",
      status: repair.status || "Pending",
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
            <h1 className="text-3xl font-bold tracking-tight">Repair & Maintenance</h1>
            <p className="text-muted-foreground">Track repair requests and status</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Repair
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingRepair ? "Edit" : "New"} Repair Record</DialogTitle>
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
                  <Label htmlFor="equipment_name">Equipment Name *</Label>
                  <Input
                    id="equipment_name"
                    value={formData.equipment_name}
                    onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="serial_number">Serial Number</Label>
                  <Input
                    id="serial_number"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="issue_description">Issue Description *</Label>
                  <Textarea
                    id="issue_description"
                    value={formData.issue_description}
                    onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="action_taken">Action Taken</Label>
                  <Textarea
                    id="action_taken"
                    value={formData.action_taken}
                    onChange={(e) => setFormData({ ...formData, action_taken: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="technician_name">Technician Name</Label>
                  <Input
                    id="technician_name"
                    value={formData.technician_name}
                    onChange={(e) => setFormData({ ...formData, technician_name: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">{editingRepair ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Equipment</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Technician</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : repairs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No repair records found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              repairs.map((repair) => (
                <TableRow key={repair.id}>
                  <TableCell className="font-medium">{repair.equipment_name}</TableCell>
                  <TableCell>{repair.serial_number || "N/A"}</TableCell>
                  <TableCell className="max-w-xs truncate">{repair.issue_description}</TableCell>
                  <TableCell>{repair.technician_name || "Unassigned"}</TableCell>
                  <TableCell>{new Date(repair.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {repair.status === "Completed" ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Completed
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {repair.status === "Pending" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleComplete(repair.id)}
                        title="Mark as completed"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(repair)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(repair.id)}
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

export default RepairMaintenance;
