import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const useMaintenanceMode = () => {
  const navigate = useNavigate();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [hasCheckedInitial, setHasCheckedInitial] = useState(false);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      try {
        const response = await fetch("http://localhost/labmate-guardian-main/api/settings.php");
        const result = await response.json();
        
        if (response.ok && result.success) {
          const isMaintenance = result.data.maintenance_mode?.value === 'true';
          const message = result.data.maintenance_message?.value || 'ERROR_MAINTENANCE_001: System temporarily unavailable for scheduled maintenance.';
          
          // Check if user is logged in
          const storedUser = localStorage.getItem("user");
          const currentUser = storedUser ? JSON.parse(storedUser) : null;
          
          // If maintenance mode was just enabled
          if (isMaintenance && !maintenanceMode) {
            setMaintenanceMode(true);
            setMaintenanceMessage(message);
            
            // Auto-logout all non-admin users
            if (currentUser && currentUser.role !== 'admin') {
              localStorage.removeItem("user");
              toast.error("MAINTENANCE_MODE_ACTIVE: System under maintenance. Session terminated for security.", {
                description: "Please contact your administrator for access details."
              });
              navigate("/login");
              return; // Stop further processing
            }
            
            // Show notification to admins that maintenance mode is active
            if (currentUser && currentUser.role === 'admin') {
              toast.info("MAINTENANCE_MODE_ENABLED: System in maintenance state. Regular users restricted.", {
                description: "All non-administrator sessions have been terminated."
              });
            }
          } 
          // If maintenance mode was disabled
          else if (!isMaintenance && maintenanceMode) {
            setMaintenanceMode(false);
            setMaintenanceMessage("");
            
            // Notify admins that maintenance mode is disabled
            if (currentUser && currentUser.role === 'admin') {
              toast.success("MAINTENANCE_MODE_DISABLED: System operational. User access restored.", {
                description: "All users can now login and access the system normally."
              });
            }
          } 
          // Regular state update
          else {
            setMaintenanceMode(isMaintenance);
            setMaintenanceMessage(message);
          }
          
          setHasCheckedInitial(true);
        }
      } catch (error) {
        console.error('Failed to check maintenance mode:', error);
      }
    };

    // Listen for custom maintenance mode change events
    const handleMaintenanceModeChange = () => {
      checkMaintenanceMode();
    };

    // Check immediately
    checkMaintenanceMode();
    
    // Check every 15 seconds for faster response
    const interval = setInterval(checkMaintenanceMode, 15000);
    
    // Listen for custom events for immediate updates
    window.addEventListener('maintenance-mode-changed', handleMaintenanceModeChange);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('maintenance-mode-changed', handleMaintenanceModeChange);
    };
  }, [navigate, maintenanceMode]);

  return { maintenanceMode, maintenanceMessage, hasCheckedInitial };
};
