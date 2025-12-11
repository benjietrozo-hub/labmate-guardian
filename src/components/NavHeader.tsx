import React from "react";
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

  // Add keyframes directly to ensure immediate loading
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes gradient-slide {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="sticky top-0 z-50 relative overflow-hidden bg-blue-500 text-white shadow-lg" style={{
      background: 'linear-gradient(to right, #2563eb, #3b82f6, #60a5fa)',
      backgroundSize: '200% 100%',
      animation: 'gradient-slide 8s ease infinite'
    }}>
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      
      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1 min-w-0">
            {showBackButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 border border-white/30 flex-shrink-0"
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
                className="text-white hover:bg-white/20 border border-white/30 flex-shrink-0"
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
                className="text-white hover:bg-white/20 border border-white/30 lg:hidden flex-shrink-0"
              >
                <Menu className="w-4 h-4" />
              </Button>
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold tracking-tight truncate">{title}</h1>
              {subtitle && (
                <p className="text-blue-100 text-sm truncate">{subtitle}</p>
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
