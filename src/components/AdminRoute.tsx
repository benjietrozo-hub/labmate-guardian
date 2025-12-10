import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const navigate = useNavigate();

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  if (currentUser.role !== "admin") {
    toast.error("Access denied. Admin privileges required.");
    navigate("/");
    return null;
  }

  return <>{children}</>;
};

export default AdminRoute;
