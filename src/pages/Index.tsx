import { AuthGuard } from "@/components/AuthGuard";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./Dashboard";

const Index = () => {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <div className="mb-4">
              <SidebarTrigger />
            </div>
            <Dashboard />
          </main>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
};

export default Index;
