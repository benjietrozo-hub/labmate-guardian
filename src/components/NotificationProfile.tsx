import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Bell, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Notification {
  title: string;
  message: string;
  timestamp: string;
  actionUrl?: string;
  read?: boolean;
  id: string;
}

interface NotificationProfileProps {
  notifications: Notification[];
  unreadCount: number;
  currentUser: any;
  markAllAsRead: () => void;
  loadMoreNotifications?: () => void;
  hasMoreNotifications?: boolean;
  totalNotifications?: number;
  removeNotification?: (id: string) => void;
  clearAllNotifications?: () => void;
}

const NotificationProfile = ({ 
  notifications, 
  unreadCount, 
  currentUser, 
  markAllAsRead,
  loadMoreNotifications,
  hasMoreNotifications = false,
  totalNotifications = 0,
  removeNotification,
  clearAllNotifications
}: NotificationProfileProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative">
            <Bell className="w-4 h-4 text-black" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white px-1 min-w-[16px]">
                {unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-auto">
          <DropdownMenuLabel className="flex justify-between items-center">
            <span>Notifications</span>
            {totalNotifications > 0 && (
              <span className="text-xs text-muted-foreground">
                {totalNotifications} total
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length > 0 && clearAllNotifications && (
            <DropdownMenuItem
              className="justify-center text-xs text-red-600 cursor-pointer hover:bg-red-50"
              onClick={() => {
                if (clearAllNotifications) {
                  clearAllNotifications();
                }
              }}
            >
              Clear All Notifications
            </DropdownMenuItem>
          )}
          {notifications.length > 0 && <DropdownMenuSeparator />}
          {notifications.length === 0 ? (
            <DropdownMenuItem className="text-xs text-muted-foreground">
              No notifications yet.
            </DropdownMenuItem>
          ) : (
            <>
              {notifications.map((n, idx) => (
                <div key={idx} className="relative group">
                  <DropdownMenuItem 
                    className="flex flex-col items-start text-xs cursor-pointer hover:bg-accent pr-8"
                    onClick={() => {
                      if (n.actionUrl) {
                        window.location.href = n.actionUrl;
                      }
                    }}
                  >
                    <span className="font-medium">{n.title}</span>
                    {n.message && (
                      <span className="text-muted-foreground">{n.message}</span>
                    )}
                    <span className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.timestamp).toLocaleString()}
                    </span>
                  </DropdownMenuItem>
                  {removeNotification && (
                    <button
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (removeNotification) {
                          removeNotification(n.id);
                        }
                      }}
                      title="Remove notification"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
              {hasMoreNotifications && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-xs text-blue-600 cursor-pointer hover:bg-blue-50"
                    onClick={() => {
                      if (loadMoreNotifications) {
                        loadMoreNotifications();
                      }
                    }}
                  >
                    View More Notifications
                  </DropdownMenuItem>
                </>
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-xs text-blue-600 cursor-pointer"
                    onClick={() => markAllAsRead()}
                  >
                    Mark all as read
                  </DropdownMenuItem>
                </>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {currentUser?.avatar_url ? (
                <img
                  src={`http://localhost/labmate-guardian-main/${currentUser.avatar_url}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-black text-left max-w-[160px] truncate">
              {currentUser?.email || "Unknown user"}
            </span>
            <span className="text-[10px] uppercase text-black">
              {currentUser?.role || "student"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Profile</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start text-xs">
            <span className="font-medium">{currentUser?.email || "Unknown"}</span>
            <span className="text-muted-foreground capitalize">
              Role: {currentUser?.role || "student"}
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate("/profile")}>
            View Profile
          </DropdownMenuItem>
          {currentUser?.role === "admin" && (
            <DropdownMenuItem onClick={() => navigate("/users")}>
              Manage Users
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default NotificationProfile;
