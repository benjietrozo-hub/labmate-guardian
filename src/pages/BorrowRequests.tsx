import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";

const BorrowRequests = () => {
  const navigate = useNavigate();
  const [borrowRequests, setBorrowRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = currentUser?.role === "admin";
  
  // WebSocket notifications
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAllAsRead, 
    loadMoreNotifications, 
    hasMoreNotifications, 
    totalNotifications,
    removeNotification,
    clearAllNotifications
  } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || ""
  );

  const fetchBorrowRequests = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/borrow_requests.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch borrow requests");
      }

      setBorrowRequests((result.data || []).filter(request => request.status !== 'approved'));
    } catch (error: any) {
      toast.error("Failed to fetch borrow requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowRequests();
  }, []);

  const handleApproveRequest = async (id: string) => {
    if (!confirm("Approve this borrow request?")) return;

    console.log("Approving request with ID:", id);
    console.log("Current user:", currentUser);

    // Immediately update the UI to show approval in progress
    const originalRequests = [...borrowRequests];
    setBorrowRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: 'approved' } : req
    ));

    try {
      const requestBody = { 
        status: "approved",
        approved_by: currentUser?.id,
        approved_at: new Date().toISOString()
      };
      
      console.log("Request body:", requestBody);

      const response = await fetch(`http://localhost/labmate-guardian-main/api/borrow_requests.php?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      
      const result = await response.json();
      console.log("Response result:", result);

      if (!response.ok || !result.success) {
        // Revert the UI change if the backend failed
        setBorrowRequests(originalRequests);
        throw new Error(result.error || "Failed to approve request");
      }
      
      toast.success("Borrow request approved successfully");
      fetchBorrowRequests(); // Refresh to get the latest data
    } catch (error: any) {
      console.error("Approval error:", error);
      // Revert the UI change if there was an error
      setBorrowRequests(originalRequests);
      toast.error("Failed to approve request: " + (error.message || "Unknown error"));
    }
  };

  const handleRejectRequest = async (id: string) => {
    const reason = prompt("Enter rejection reason (optional):");
    
    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/borrow_requests.php?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: "rejected",
          approved_by: currentUser?.id,
          approved_at: new Date().toISOString(),
          rejection_reason: reason || ""
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to reject request");
      }
      toast.success("Borrow request rejected");
      fetchBorrowRequests();
    } catch (error: any) {
      toast.error("Failed to reject request");
    }
  };

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Are you sure you want to delete this request?")) return;

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/borrow_requests.php?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete request");
      }
      toast.success("Request deleted successfully");
      fetchBorrowRequests();
    } catch (error: any) {
      toast.error("Failed to delete request");
    }
  };

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6 pt-20">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-muted-foreground">Only administrators can view borrow requests.</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <NavHeader 
        title="Borrow Requests" 
        subtitle="Manage all borrow equipment requests"
        showBackButton={true}
        showHomeButton={true}
      >
        <NotificationProfile 
          notifications={notifications}
          unreadCount={unreadCount}
          currentUser={currentUser}
          markAllAsRead={markAllAsRead}
          loadMoreNotifications={loadMoreNotifications}
          hasMoreNotifications={hasMoreNotifications}
          totalNotifications={totalNotifications}
          removeNotification={removeNotification}
          clearAllNotifications={clearAllNotifications}
        />
      </NavHeader>
      <div className="container mx-auto p-6 pt-20">
        {isConnected && (
          <div className="mb-4">
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
              Connected
            </Badge>
          </div>
        )}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrower</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Expected Return</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : borrowRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No borrow requests found.
                  </TableCell>
                </TableRow>
              ) : (
                borrowRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.borrower_name}</TableCell>
                    <TableCell>{request.borrower_email}</TableCell>
                    <TableCell>{request.item}</TableCell>
                    <TableCell>{request.quantity}</TableCell>
                    <TableCell>{new Date(request.request_date).toLocaleDateString()}</TableCell>
                    <TableCell>{request.return_date ? new Date(request.return_date).toLocaleDateString() : "N/A"}</TableCell>
                    <TableCell>
                      {request.status === "pending" && (
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                          Pending Approval
                        </Badge>
                      )}
                      {request.status === "approved" && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          Approved
                        </Badge>
                      )}
                      {request.status === "rejected" && (
                        <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {request.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleApproveRequest(request.id)}
                            title="Approve request"
                          >
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRejectRequest(request.id)}
                            title="Reject request"
                          >
                            <XCircle className="w-4 h-4 text-red-600" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteRequest(request.id)}
                        title="Delete request"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default BorrowRequests;
