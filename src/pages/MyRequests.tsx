import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Eye } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";

const MyRequests = () => {
  const navigate = useNavigate();
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;

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

  const fetchMyRequests = async () => {
    if (!currentUser?.email) {
      toast.error("User information not found");
      return;
    }

    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/borrow_requests.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch borrow requests");
      }

      // Filter requests for the current user
      const userRequests = (result.data || []).filter(request => 
        request.borrower_email === currentUser.email
      );

      setMyRequests(userRequests);
    } catch (error: any) {
      toast.error("Failed to fetch your requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, [currentUser]);

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
      fetchMyRequests();
    } catch (error: any) {
      toast.error("Failed to delete request");
    }
  };

  const handleViewDetails = (request: any) => {
    // You could open a modal with more details or navigate to a details page
    alert(`Request Details:\n\nItem: ${request.item}\nQuantity: ${request.quantity}\nStatus: ${request.status}\nRequest Date: ${new Date(request.request_date).toLocaleDateString()}\nReturn Date: ${request.return_date ? new Date(request.return_date).toLocaleDateString() : 'Not specified'}${request.rejection_reason ? `\nRejection Reason: ${request.rejection_reason}` : ''}`);
  };

  return (
    <div>
      <NavHeader 
        title="My Requests" 
        subtitle="View and manage your borrow equipment requests"
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
        
        <div className="mb-4">
          <Button onClick={() => navigate("/borrow")} className="mr-2">
            Browse Available Items
          </Button>
          <Button variant="outline" onClick={fetchMyRequests}>
            Refresh
          </Button>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
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
                  <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : myRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    You haven't made any borrow requests yet.
                  </TableCell>
                </TableRow>
              ) : (
                myRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.item}</TableCell>
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
                      {request.status === "borrowed" && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Borrowed
                        </Badge>
                      )}
                      {request.status === "returned" && (
                        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                          Returned
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleViewDetails(request)}
                        title="View details"
                      >
                        <Eye className="w-4 h-4 text-blue-600" />
                      </Button>
                      {request.status === "pending" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteRequest(request.id)}
                          title="Delete request"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      )}
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

export default MyRequests;
