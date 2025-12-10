import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangle, Settings } from "lucide-react";

interface SystemSettings {
  maintenance_mode: { value: string; description: string };
  maintenance_message: { value: string; description: string };
}

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/settings.php");
      const result = await response.json();
      
      if (response.ok && result.success) {
        setSettings(result.data);
        setMessageInput(result.data.maintenance_message?.value || "");
      } else {
        throw new Error(result.error || "Failed to fetch settings");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceToggle = async (enabled: boolean) => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        maintenance_mode: { ...settings.maintenance_mode, value: enabled.toString() }
      };

      const response = await fetch("http://localhost/labmate-guardian-main/api/settings.php", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSettings),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSettings(updatedSettings);
        
        if (enabled) {
          toast.success("MAINTENANCE_MODE_ENABLED: System lockdown initiated.", {
            description: "All user sessions will be terminated within 15 seconds."
          });
          
          // Force immediate check of maintenance mode on all clients
          // This will trigger the useMaintenanceMode hook to logout users immediately
          setTimeout(() => {
            window.dispatchEvent(new Event('storage'));
            // Also trigger a custom event for same-tab updates
            window.dispatchEvent(new CustomEvent('maintenance-mode-changed', { 
              detail: { enabled: true } 
            }));
          }, 100);
        } else {
          toast.success("MAINTENANCE_MODE_DISABLED: System access restored.", {
            description: "All users can now login and access the system."
          });
        }
      } else {
        throw new Error(result.error || "Failed to update settings");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleMessageSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    try {
      const updatedSettings = {
        ...settings,
        maintenance_message: { ...settings.maintenance_message, value: messageInput }
      };

      const response = await fetch("http://localhost/labmate-guardian-main/api/settings.php", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedSettings),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSettings(updatedSettings);
        toast.success("MESSAGE_UPDATED: Maintenance message saved successfully.");
      } else {
        throw new Error(result.error || "Failed to update settings");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const logoutAllUsers = () => {
    // This will be handled by the frontend checking maintenance mode
    // For now, just show a message
    toast.info("All users will be logged out on their next action");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMaintenanceMode = settings?.maintenance_mode?.value === 'true';

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            General System Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="space-y-1">
                <Label htmlFor="maintenance-mode" className="text-base font-medium">
                  Maintenance Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, all users will be logged out and unable to access the system
                </p>
              </div>
              <Switch
                id="maintenance-mode"
                checked={isMaintenanceMode}
                onCheckedChange={handleMaintenanceToggle}
                disabled={saving}
              />
            </div>

            {isMaintenanceMode && (
              <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-800">
                      Maintenance mode is currently active
                    </p>
                    <p className="text-xs text-orange-700">
                      All users are blocked from logging in and will be logged out automatically.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="maintenance-message">Maintenance Message</Label>
              <div className="flex gap-2">
                <Input
                  id="maintenance-message"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Enter maintenance message..."
                  disabled={saving}
                  className="flex-1"
                />
                <Button 
                  onClick={handleMessageSave}
                  disabled={saving || messageInput === settings?.maintenance_message?.value}
                  size="sm"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This message will be displayed to users when maintenance mode is active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
