import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthGuard } from "@/components/AuthGuard";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import AdminRoute from "@/components/AdminRoute";
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
import SystemSettings from "./pages/SystemSettings";
import Categories from "./pages/settings/Categories";
import StatusSettings from "./pages/settings/StatusSettings";
import MyBorrows from "./pages/MyBorrows";
import BorrowRequests from "./pages/BorrowRequests";
import MyRequests from "./pages/MyRequests";
import LabUsage from "./pages/LabUsage";
import Announcements from "./pages/Announcements";
import LabSchedule from "./pages/LabSchedule";
import EquipmentMonitoring from "./pages/EquipmentMonitoring";
import Notifications from "./pages/Notifications";
import Reservations from "./pages/Reservations";
import Analytics from "./pages/Analytics";
import UserAnalytics from "./pages/UserAnalytics";

type Notification = {
  title: string;
  message: string;
  timestamp: string;
};

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  
  // Check maintenance mode
  useMaintenanceMode();

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser: { id: string; email: string; role?: string; avatar_url?: string } | null = storedUser
    ? JSON.parse(storedUser)
    : null;

  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || "student"
  );

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 ml-6">
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
          <Route path="/inventory" element={<ProtectedLayout><AdminRoute><Inventory /></AdminRoute></ProtectedLayout>} />
          <Route path="/borrow" element={<ProtectedLayout><BorrowItems /></ProtectedLayout>} />
          <Route path="/borrow-requests" element={<ProtectedLayout><AdminRoute><BorrowRequests /></AdminRoute></ProtectedLayout>} />
          <Route path="/my-requests" element={<ProtectedLayout><MyRequests /></ProtectedLayout>} />
          <Route path="/my-borrows" element={<ProtectedLayout><MyBorrows /></ProtectedLayout>} />
          <Route path="/visitors" element={<ProtectedLayout><AdminRoute><VisitorLogs /></AdminRoute></ProtectedLayout>} />
          <Route path="/repairs" element={<ProtectedLayout><RepairMaintenance /></ProtectedLayout>} />
          <Route path="/reservations" element={<ProtectedLayout><Reservations /></ProtectedLayout>} />
          <Route path="/analytics" element={<ProtectedLayout><AdminRoute><Analytics /></AdminRoute></ProtectedLayout>} />
          <Route path="/my-analytics" element={<ProtectedLayout><UserAnalytics /></ProtectedLayout>} />
          <Route path="/users" element={<ProtectedLayout><AdminRoute><Users /></AdminRoute></ProtectedLayout>} />
          <Route path="/profile" element={<ProtectedLayout><Profile /></ProtectedLayout>} />
          <Route path="*" element={<NotFound />} />
          <Route path="/settings" element={<ProtectedLayout><AdminRoute><SystemSettings /></AdminRoute></ProtectedLayout>} />
          <Route path="/settings/categories" element={<ProtectedLayout><AdminRoute><Categories /></AdminRoute></ProtectedLayout>} />
          <Route path="/settings/status" element={<ProtectedLayout><AdminRoute><StatusSettings /></AdminRoute></ProtectedLayout>} />

        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
