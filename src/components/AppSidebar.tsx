import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  AlertCircle, 
  Package, 
  Boxes, 
  ClipboardList, 
  Users, 
  Wrench,
  LogOut,
  Computer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const items = [
  { title: "Incident Reports", url: "/incidents", icon: AlertCircle },
  { title: "Lost & Found", url: "/lost-found", icon: Package },
  { title: "Inventory Equipment", url: "/inventory", icon: Boxes },
  { title: "Borrow Items", url: "/borrow", icon: ClipboardList },
  { title: "Visitor Logs", url: "/visitors", icon: Users },
  { title: "Repair & Maintenance", url: "/repairs", icon: Wrench },
];

export function AppSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  const handleLogout = async () => {
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-2 border-b border-sidebar-border">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shrink-0">
            <Computer className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">Computer Lab</span>
              <span className="text-xs text-muted-foreground">Management System</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Modules</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={currentPath === item.url}>
                    <NavLink to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {currentUser?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={currentPath === "/users"}>
                    <NavLink to="/users">
                      <Users className="w-4 h-4" />
                      <span>User Management</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <Button 
          variant="ghost" 
          className="w-full justify-start" 
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {sidebarOpen && <span>Logout</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
