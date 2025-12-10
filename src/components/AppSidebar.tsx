import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Settings, ListOrdered, ToggleLeft } from "lucide-react";

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
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  AlertCircle, 
  Package, 
  Boxes, 
  ClipboardList, 
  Users, 
  Wrench,
  Computer
} from "lucide-react";

const items = [
  { title: "Incident Reports", url: "/incidents", icon: AlertCircle },
  { title: "Lost & Found", url: "/lost-found", icon: Package },
  { title: "Repair & Maintenance", url: "/repairs", icon: Wrench },
];

const adminItems = [
  { title: "Borrow Requests", url: "/borrow-requests", icon: ClipboardList },
  { title: "Borrowed Items", url: "/borrow", icon: Package },
  { title: "Inventory Equipment", url: "/inventory", icon: Boxes },
  { title: "Visitor Logs", url: "/visitors", icon: Users },
];

const teacherItems = [
  { title: "Borrow Equipment", url: "/borrow", icon: Package },
  { title: "My Borrowed Items", url: "/my-borrows", icon: ClipboardList },
];

const studentItems = [
  { title: "Borrow Equipment", url: "/borrow", icon: Package },
];
const settings = [
  { title: "General Settings", url: "/settings", icon: Settings },
  { title: "Categories", url: "/settings/categories", icon: ListOrdered },
  { title: "Status Manager", url: "/settings/status", icon: ToggleLeft },
];


export function AppSidebar() {
  const { open: sidebarOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex flex-col gap-2">
            <div className="flex justify-end">
              <SidebarTrigger />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shrink-0">
                <Computer className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 ml-3">
                  <h2 className="text-lg font-semibold">LabMate Guardian</h2>
                  <p className="text-xs text-muted-foreground">Lab Management System</p>
                </div>
              )}
            </div>
          </div>
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
              {(currentUser?.role === "admin" || currentUser?.role === "instructor" || currentUser?.role === "teacher" || currentUser?.role === "student") && (
                <SidebarGroup>
                  <SidebarGroupLabel>Borrow Management</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {currentUser?.role === "admin" && (
                        <>
                          {adminItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton asChild isActive={currentPath === item.url}>
                                <NavLink to={item.url}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </>
                      )}
                      {(currentUser?.role === "instructor" || currentUser?.role === "teacher") && (
                        <>
                          {teacherItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton asChild isActive={currentPath === item.url}>
                                <NavLink to={item.url}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </>
                      )}
                      {currentUser?.role === "student" && (
                        <>
                          {studentItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                              <SidebarMenuButton asChild isActive={currentPath === item.url}>
                                <NavLink to={item.url}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                        </>
                      )}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              )}
              {currentUser?.role === "admin" && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={currentPath === "/users"}>
                      <NavLink to="/users">
                        <Users className="w-4 h-4" />
                        <span>User Management</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>My Records</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {currentUser?.role !== "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={currentPath === "/my-requests"}>
                    <NavLink to="/my-requests">
                      <ClipboardList className="w-4 h-4" />
                      <span>My Requests</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={currentPath === "/my-borrows"}>
                  <NavLink to="/my-borrows">
                    <ClipboardList className="w-4 h-4" />
                    <span>My Borrowed Items</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {currentUser?.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>System Settings</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {settings.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={currentPath === item.url}>
                      <NavLink to={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
