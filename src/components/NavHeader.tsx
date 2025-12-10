import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Menu, Home } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import "./NavHeader.css";

interface NavHeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  showHomeButton?: boolean;
  children?: React.ReactNode; // To pass existing notification and profile
}

const NavHeader = ({ title, subtitle, showBackButton = false, showMenuButton = false, showHomeButton = false, children }: NavHeaderProps) => {
  const navigate = useNavigate();
  const { toggleSidebar } = useSidebar();

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white gradient-animate">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      
      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {showHomeButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-white hover:bg-white/20 border border-white/30"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            )}
            
            {showMenuButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="text-white hover:bg-white/20 border border-white/30 lg:hidden"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
            
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="text-blue-100 text-sm">{subtitle}</p>
              )}
            </div>
          </div>

          {/* Right side - Pass existing notification and profile */}
          {children && (
            <div className="flex items-center space-x-3">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavHeader;
