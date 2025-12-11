import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, ArrowLeft, Calendar, Package } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";

interface BorrowRecord {
  id: string;
  borrower_name: string;
  borrower_email?: string;
  item: string;
  quantity: number;
  borrow_date: string;
  return_date: string;
  status: "Borrowed" | "Returned";
}

const MyBorrows = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<BorrowRecord[]>([]);
  const [loading, setLoading] = useState(true);
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const userRole = currentUser?.role || "student";
  
  const { notifications, unreadCount, markAllAsRead, loadMoreNotifications, hasMoreNotifications, totalNotifications, removeNotification, clearAllNotifications } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || ""
  );

  useEffect(() => {
    fetchMyRecords();
  }, []);

  const fetchMyRecords = async () => {
    try {
      const storedUser = localStorage.getItem("user");
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      
      if (!currentUser) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost/labmate-guardian-main/api/borrow_items.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch borrow records");
      }

      // Filter records for current user (works for both instructors and students)
      const userRecords = (result.data || []).filter(
        (record: BorrowRecord) => record.borrower_email === currentUser.email
      );
      
      console.log(`Found ${userRecords.length} borrowed items for ${currentUser.email} (Role: ${currentUser.role || 'student'})`);
      setRecords(userRecords);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch your borrow records");
    } finally {
      setLoading(false);
    }
  };

  const handleReturn = async (id: string) => {
    if (!confirm("Are you sure you want to mark this item as returned?")) return;

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/borrow_items.php?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "Returned",
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update status");
      }

      toast.success("Item marked as returned");
      fetchMyRecords();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const isOverdue = (returnDate: string) => {
    if (!returnDate) return false;
    return new Date(returnDate) < new Date();
  };

  const getDaysLeft = (returnDate: string) => {
    if (!returnDate) return null;
    const today = new Date();
    const dueDate = new Date(returnDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div>
      <NavHeader 
        title="My Borrowed Items" 
        subtitle={`View your borrowed equipment and return dates (${userRole === 'instructor' || userRole === 'teacher' ? 'Instructor Account' : 'Student Account'})`}
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
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-4 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : records.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No borrowed items</h3>
            <p>You haven't borrowed any items yet. Visit the Borrow Items page to get started.</p>
            <Button 
              className="mt-4" 
              onClick={() => navigate("/borrow")}
            >
              Browse Items to Borrow
            </Button>
          </div>
        ) : (
          records.map((record) => {
            const daysLeft = getDaysLeft(record.return_date);
            const overdue = isOverdue(record.return_date);
            
            return (
              <Card key={record.id} className={`hover:shadow-lg transition-shadow ${
                overdue && record.status === "Borrowed" ? "border-red-200 bg-red-50/50" : ""
              }`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{record.item}</CardTitle>
                      <CardDescription className="text-sm">
                        Quantity: {record.quantity}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge 
                        variant={record.status === "Returned" ? "outline" : "secondary"}
                        className={`${
                          record.status === "Returned" 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : overdue 
                              ? "bg-red-100 text-red-800 border-red-200"
                              : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }`}
                      >
                        {record.status}
                        {record.status === "Borrowed" && overdue && " (Overdue)"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Borrowed:</span>
                        <p className="text-muted-foreground">
                          {new Date(record.borrow_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-medium">Due Date:</span>
                        <p className={`text-muted-foreground ${
                          overdue && record.status === "Borrowed" ? "text-red-600 font-medium" : ""
                        }`}>
                          {record.return_date 
                            ? new Date(record.return_date).toLocaleDateString()
                            : "No due date"
                          }
                        </p>
                      </div>
                    </div>
                    {record.status === "Borrowed" && daysLeft !== null && record.return_date && (
                      <div>
                        <span className="font-medium">Time Left:</span>
                        <p className={`${
                          overdue ? "text-red-600 font-medium" : 
                          daysLeft <= 3 ? "text-yellow-600 font-medium" : "text-muted-foreground"
                        }`}>
                          {overdue 
                            ? `${Math.abs(daysLeft)} days overdue`
                            : daysLeft === 0 
                              ? "Due today"
                              : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
                {record.status === "Borrowed" && (
                  <CardFooter>
                    <Button 
                      onClick={() => handleReturn(record.id)}
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Returned
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default MyBorrows;
