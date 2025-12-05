import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthGuard } from "@/components/AuthGuard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User as UserIcon, Bell } from "lucide-react";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import Login from "./pages/Login";
import IncidentReports from "./pages/IncidentReports";
import LostFound from "./pages/LostFound";
import Inventory from "./pages/Inventory";
import BorrowItems from "./pages/BorrowItems";
import VisitorLogs from "./pages/VisitorLogs";
import RepairMaintenance from "./pages/RepairMaintenance";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";

type Notification = {
  title: string;
  message: string;
  timestamp: string;
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser: { id: string; email: string; role?: string; avatar_url?: string } | null = storedUser
    ? JSON.parse(storedUser)
    : null;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const ws = new WebSocket("ws://localhost:8081");

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "identify",
          userId: currentUser.id,
          role: currentUser.role || "user",
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "notification" && data.payload) {
          setNotifications((prev) => [data.payload, ...prev].slice(0, 20));
          setUnreadCount((prev) => prev + 1);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => {
      // silently ignore for now
    };

    return () => {
      ws.close();
    };
  }, [currentUser?.id, currentUser?.role]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="mb-4 flex items-center justify-between">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="relative">
                      <Bell className="w-4 h-4" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white px-1 min-w-[16px]">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 max-h-80 overflow-auto">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.length === 0 ? (
                      <DropdownMenuItem className="text-xs text-muted-foreground">
                        No notifications yet.
                      </DropdownMenuItem>
                    ) : (
                      notifications.map((n, idx) => (
                        <DropdownMenuItem key={idx} className="flex flex-col items-start text-xs">
                          <span className="font-medium">{n.title}</span>
                          {n.message && (
                            <span className="text-muted-foreground">{n.message}</span>
                          )}
                          <span className="text-[10px] text-muted-foreground mt-1">
                            {new Date(n.timestamp).toLocaleString()}
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                    {notifications.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="justify-center text-xs text-blue-600 cursor-pointer"
                          onClick={() => setUnreadCount(0)}
                        >
                          Mark all as read
                        </DropdownMenuItem>
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
                      <span className="text-xs text-muted-foreground text-left max-w-[160px] truncate">
                        {currentUser?.email || "Unknown user"}
                      </span>
                      <span className="text-[10px] uppercase text-muted-foreground">
                        {currentUser?.role || "user"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Profile</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex flex-col items-start text-xs">
                      <span className="font-medium">{currentUser?.email || "Unknown"}</span>
                      <span className="text-muted-foreground capitalize">
                        Role: {currentUser?.role || "user"}
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
            </div>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedLayout><Index /></ProtectedLayout>} />
          <Route path="/incidents" element={<ProtectedLayout><IncidentReports /></ProtectedLayout>} />
          <Route path="/lost-found" element={<ProtectedLayout><LostFound /></ProtectedLayout>} />
          <Route path="/inventory" element={<ProtectedLayout><Inventory /></ProtectedLayout>} />
          <Route path="/borrow" element={<ProtectedLayout><BorrowItems /></ProtectedLayout>} />
          <Route path="/visitors" element={<ProtectedLayout><VisitorLogs /></ProtectedLayout>} />
          <Route path="/repairs" element={<ProtectedLayout><RepairMaintenance /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout><Users /></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
