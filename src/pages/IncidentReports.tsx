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
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";

const IncidentReports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any>(null);
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  
  const { notifications, unreadCount, markAllAsRead } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || ""
  );
  const [formData, setFormData] = useState({
    article: "",
    description: "",
    serial_number: "",
    date_acquired: "",
    po_number: "",
    property_number: "",
    new_property_number: "",
    unit_of_measure: "",
    unit_value: "",
    balance_per_card_qty: "",
    on_hand_per_card_qty: "",
    total_value: "",
    accredited_to: "",
    remarks: "",
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/incident_reports.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch incident reports");
      }

      setReports(result.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch incident reports");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      
      const reportData = {
        ...formData,
        unit_value: formData.unit_value ? parseFloat(formData.unit_value) : null,
        total_value: formData.total_value ? parseFloat(formData.total_value) : null,
        balance_per_card_qty: formData.balance_per_card_qty ? parseInt(formData.balance_per_card_qty) : null,
        on_hand_per_card_qty: formData.on_hand_per_card_qty ? parseInt(formData.on_hand_per_card_qty) : null,
        created_by: user?.id,
      };

      if (editingReport) {
        const response = await fetch(`http://localhost/labmate-guardian-main/api/incident_reports.php?id=${editingReport.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reportData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to update incident report");
        }
        toast.success("Incident report updated successfully");
      } else {
        const response = await fetch("http://localhost/labmate-guardian-main/api/incident_reports.php", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reportData),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to create incident report");
        }
        toast.success("Incident report created successfully");
      }

      setOpen(false);
      resetForm();
      fetchReports();
    } catch (error: any) {
      toast.error(error.message || "Failed to save incident report");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/incident_reports.php?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete incident report");
      }
      toast.success("Incident report deleted successfully");
      fetchReports();
    } catch (error: any) {
      toast.error("Failed to delete incident report");
    }
  };

  const resetForm = () => {
    setFormData({
      article: "",
      description: "",
      serial_number: "",
      date_acquired: "",
      po_number: "",
      property_number: "",
      new_property_number: "",
      unit_of_measure: "",
      unit_value: "",
      balance_per_card_qty: "",
      on_hand_per_card_qty: "",
      total_value: "",
      accredited_to: "",
      remarks: "",
    });
    setEditingReport(null);
  };

  const handleEdit = (report: any) => {
    setEditingReport(report);
    setFormData({
      article: report.article || "",
      description: report.description || "",
      serial_number: report.serial_number || "",
      date_acquired: report.date_acquired || "",
      po_number: report.po_number || "",
      property_number: report.property_number || "",
      new_property_number: report.new_property_number || "",
      unit_of_measure: report.unit_of_measure || "",
      unit_value: report.unit_value?.toString() || "",
      balance_per_card_qty: report.balance_per_card_qty?.toString() || "",
      on_hand_per_card_qty: report.on_hand_per_card_qty?.toString() || "",
      total_value: report.total_value?.toString() || "",
      accredited_to: report.accredited_to || "",
      remarks: report.remarks || "",
    });
    setOpen(true);
  };

  return (
    <div>
      <NavHeader 
        title="Incident Reports" 
        subtitle="Track and manage equipment incidents"
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
                Add Report
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingReport ? "Edit" : "Create"} Incident Report</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="article">Article *</Label>
                  <Input
                    id="article"
                    value={formData.article}
                    onChange={(e) => setFormData({ ...formData, article: e.target.value })}
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
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_acquired">Date Acquired</Label>
                  <Input
                    id="date_acquired"
                    type="date"
                    value={formData.date_acquired}
                    onChange={(e) => setFormData({ ...formData, date_acquired: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="po_number">PO Number</Label>
                  <Input
                    id="po_number"
                    value={formData.po_number}
                    onChange={(e) => setFormData({ ...formData, po_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_number">Property Number</Label>
                  <Input
                    id="property_number"
                    value={formData.property_number}
                    onChange={(e) => setFormData({ ...formData, property_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new_property_number">New Property Number</Label>
                  <Input
                    id="new_property_number"
                    value={formData.new_property_number}
                    onChange={(e) => setFormData({ ...formData, new_property_number: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_of_measure">Unit of Measure</Label>
                  <Input
                    id="unit_of_measure"
                    placeholder="e.g., pcs, set"
                    value={formData.unit_of_measure}
                    onChange={(e) => setFormData({ ...formData, unit_of_measure: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit_value">Unit Value</Label>
                  <Input
                    id="unit_value"
                    type="number"
                    step="0.01"
                    value={formData.unit_value}
                    onChange={(e) => setFormData({ ...formData, unit_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="balance_per_card_qty">Balance Per Card Qty</Label>
                  <Input
                    id="balance_per_card_qty"
                    type="number"
                    value={formData.balance_per_card_qty}
                    onChange={(e) => setFormData({ ...formData, balance_per_card_qty: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="on_hand_per_card_qty">On Hand Per Card Qty</Label>
                  <Input
                    id="on_hand_per_card_qty"
                    type="number"
                    value={formData.on_hand_per_card_qty}
                    onChange={(e) => setFormData({ ...formData, on_hand_per_card_qty: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_value">Total Value</Label>
                  <Input
                    id="total_value"
                    type="number"
                    step="0.01"
                    value={formData.total_value}
                    onChange={(e) => setFormData({ ...formData, total_value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accredited_to">Accredited To</Label>
                  <Input
                    id="accredited_to"
                    value={formData.accredited_to}
                    onChange={(e) => setFormData({ ...formData, accredited_to: e.target.value })}
                  />
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit">{editingReport ? "Update" : "Create"}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Article</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Property Number</TableHead>
              <TableHead>Unit Value</TableHead>
              <TableHead>Accredited To</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">Loading...</TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No incident reports found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.article}</TableCell>
                  <TableCell>{report.serial_number || "N/A"}</TableCell>
                  <TableCell>{report.property_number || "N/A"}</TableCell>
                  <TableCell>{report.unit_value ? `$${report.unit_value}` : "N/A"}</TableCell>
                  <TableCell>{report.accredited_to || "N/A"}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(report)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(report.id)}
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

export default IncidentReports;
