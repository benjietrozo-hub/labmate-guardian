import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Computer, AlertTriangle, Eye, EyeOff } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  useEffect(() => {
    checkMaintenanceMode();
  }, []);

  const checkMaintenanceMode = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/settings.php");
      const result = await response.json();
      
      if (response.ok && result.success) {
        const isMaintenance = result.data.maintenance_mode?.value === 'true';
        const message = result.data.maintenance_message?.value || 'ERROR_MAINTENANCE_001: System temporarily unavailable for scheduled maintenance.';
        
        setMaintenanceMode(isMaintenance);
        setMaintenanceMessage(message);
      }
    } catch (error) {
      console.error('Failed to check maintenance mode:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (maintenanceMode) {
      // Allow admins to login during maintenance mode
      // But show a warning that maintenance mode is active
      toast.warning("MAINTENANCE_MODE_ACTIVE: System restricted access.", {
        description: "Administrator privileges required for login."
      });
    }
    
    setLoading(true);

    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/auth_login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to login");
      }

      if (data.user) {
        // Check if maintenance mode is active and user is not admin
        if (maintenanceMode && data.user.role !== 'admin') {
          toast.error("ACCESS_DENIED: Maintenance mode active.", {
            description: "Only administrators can access the system during maintenance."
          });
          return;
        }
        
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      
      toast.success("Successfully logged in!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  if (maintenanceMode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <Computer className="w-8 h-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Computer Lab System</CardTitle>
              <CardDescription>Admin Login - Maintenance Mode Active</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-xs font-medium text-orange-800">
                    Maintenance Mode Active
                  </p>
                  <p className="text-xs text-orange-700">
                    Only administrators can login during maintenance.
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Admin Sign In"}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Administrator access only during maintenance.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Computer className="w-8 h-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl">Computer Lab System</CardTitle>
            <CardDescription>Sign in to manage your laboratory</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Accounts are created by the system administrator.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
