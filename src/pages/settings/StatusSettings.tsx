import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, ToggleLeft, Settings, BarChart3 } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";

interface Status {
  id: number;
  name: string;
  description: string;
  color: string;
  is_default: boolean;
  item_count: number;
  created_at: string;
}

export default function StatusSettings() {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6b7280",
    is_default: false
  });
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  
  const { notifications, unreadCount, markAllAsRead, loadMoreNotifications, hasMoreNotifications, totalNotifications, removeNotification, clearAllNotifications } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || ""
  );

  const colorOptions = [
    { value: "#10b981", label: "Green", class: "bg-green-500" },
    { value: "#3b82f6", label: "Blue", class: "bg-blue-500" },
    { value: "#f59e0b", label: "Amber", class: "bg-amber-500" },
    { value: "#ef4444", label: "Red", class: "bg-red-500" },
    { value: "#8b5cf6", label: "Purple", class: "bg-purple-500" },
    { value: "#6b7280", label: "Gray", class: "bg-gray-500" },
  ];

  // Calculate total items for percentage calculations
  const totalItems = statuses.reduce((sum, status) => sum + status.item_count, 0);

  // Simple bar chart component
  const StatusBarChart = ({ status }: { status: Status }) => {
    const percentage = totalItems > 0 ? (status.item_count / totalItems) * 100 : 0;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">{status.item_count} items</span>
          <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${percentage}%`,
              backgroundColor: status.color 
            }}
          />
        </div>
      </div>
    );
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockStatuses: Status[] = [
        {
          id: 1,
          name: "Available",
          description: "Item is available for borrowing",
          color: "#10b981",
          is_default: true,
          item_count: 45,
          created_at: "2024-01-15T10:30:00Z"
        },
        {
          id: 2,
          name: "Borrowed",
          description: "Item is currently borrowed",
          color: "#3b82f6",
          is_default: false,
          item_count: 12,
          created_at: "2024-01-15T10:30:00Z"
        },
        {
          id: 3,
          name: "Under Maintenance",
          description: "Item is under maintenance",
          color: "#f59e0b",
          is_default: false,
          item_count: 8,
          created_at: "2024-01-15T10:30:00Z"
        },
        {
          id: 4,
          name: "Damaged",
          description: "Item is damaged and needs repair",
          color: "#ef4444",
          is_default: false,
          item_count: 3,
          created_at: "2024-01-15T10:30:00Z"
        },
        {
          id: 5,
          name: "Reserved",
          description: "Item is reserved for future use",
          color: "#8b5cf6",
          is_default: false,
          item_count: 5,
          created_at: "2024-01-15T10:30:00Z"
        }
      ];
      
      setStatuses(mockStatuses);
    } catch (error) {
      toast.error("Failed to fetch statuses");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Status name is required");
      return;
    }

    try {
      if (editingStatus) {
        // Update existing status
        setStatuses(prev => prev.map(status => 
          status.id === editingStatus.id 
            ? { ...status, ...formData }
            : status
        ));
        toast.success("Status updated successfully");
      } else {
        // Add new status
        const newStatus: Status = {
          id: Date.now(),
          name: formData.name,
          description: formData.description,
          color: formData.color,
          is_default: formData.is_default,
          item_count: 0,
          created_at: new Date().toISOString()
        };
        setStatuses(prev => [...prev, newStatus]);
        toast.success("Status added successfully");
      }
      
      setFormData({ name: "", description: "", color: "#6b7280", is_default: false });
      setShowAddForm(false);
      setEditingStatus(null);
    } catch (error) {
      toast.error("Failed to save status");
    }
  };

  const handleEdit = (status: Status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name,
      description: status.description,
      color: status.color,
      is_default: status.is_default
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this status?")) {
      try {
        setStatuses(prev => prev.filter(status => status.id !== id));
        toast.success("Status deleted successfully");
      } catch (error) {
        toast.error("Failed to delete status");
      }
    }
  };

  const handleCancel = () => {
    setFormData({ name: "", description: "", color: "#6b7280", is_default: false });
    setShowAddForm(false);
    setEditingStatus(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Status Manager</h1>
            <p className="text-muted-foreground">Manage item status options</p>
          </div>
        </div>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <NavHeader 
        title="Status Manager" 
        subtitle="Manage item status options"
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
      <div className="container mx-auto p-6 pt-20">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              <CardTitle>Status Overview</CardTitle>
            </div>
            <CardDescription>
              Total items: {totalItems} across {statuses.length} statuses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {statuses.map((status) => (
                <StatusBarChart key={status.id} status={status} />
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingStatus ? "Edit Status" : "Add New Status"}</CardTitle>
            <CardDescription>
              {editingStatus ? "Update status information" : "Create a new item status"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Status Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter status name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter status description"
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        formData.color === color.value ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                      onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    />
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Default Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Set this as the default status for new items
                  </p>
                </div>
                <Switch
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_default: checked }))}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  {editingStatus ? "Update" : "Create"} Status
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statuses.map((status) => (
          <Card key={status.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: status.color }}
                  />
                  <CardTitle className="text-lg">{status.name}</CardTitle>
                  {status.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Default
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(status)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(status.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {status.description && (
                <CardDescription className="mt-2">
                  {status.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Mini chart for this status */}
                <StatusBarChart status={status} />
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" style={{ borderColor: status.color, color: status.color }}>
                    {status.item_count} items
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Created {new Date(status.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {statuses.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <ToggleLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No statuses yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first item status
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Status
            </Button>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};
