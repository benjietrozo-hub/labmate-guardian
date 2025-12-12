import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, CheckCircle, XCircle, Package, Wrench, Cpu } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";

const BorrowItems = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [tools, setTools] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnItem, setReturnItem] = useState<any>(null);
  const [returnCondition, setReturnCondition] = useState<string>("good");
  const [returnNotes, setReturnNotes] = useState<string>("");
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  const isAdmin = currentUser?.role === "admin";
  const canBorrow = currentUser?.role === "admin" || currentUser?.role === "instructor" || currentUser?.role === "teacher" || currentUser?.role === "student";
  
  const { notifications, unreadCount, isConnected, markAllAsRead, loadMoreNotifications, hasMoreNotifications, totalNotifications, removeNotification, clearAllNotifications } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || ""
  );

  const [formData, setFormData] = useState({
    borrower_name: "",
    item: "",
    quantity: "",
    borrow_date: "",
    return_date: "",
    status: "Borrowed",
  });

  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [borrowFormData, setBorrowFormData] = useState({
    borrower_name: "",
    borrower_email: "",
    quantity: "1",
    return_date: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
    if (!isAdmin) {
      fetchAvailableItems();
    }
  }, [isAdmin]);

  const fetchAvailableItems = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/inventory_equipment.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch inventory items");
      }

      setAvailableItems(result.data || []);
      
      // Separate items by type
      const items = result.data || [];
      const toolsList = items.filter((item: any) => item.item_type === 'tool');
      const equipmentList = items.filter((item: any) => item.item_type === 'equipment');
      
      setTools(toolsList);
      setEquipment(equipmentList);
    } catch (error: any) {
      console.error("Failed to fetch inventory items:", error);
      toast.error("Failed to fetch available equipment");
    } finally {
      setInventoryLoading(false);
    }
  };

  const fetchItems = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/borrow_items.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch borrow records");
      }

      setItems(result.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch borrow records");
    } finally {
      setLoading(false);
    }
  };

  const openReturnModal = (item: any) => {
    setReturnItem(item);
    setReturnCondition("good");
    setReturnNotes("");
    setReturnModalOpen(true);
  };

  const handleConfirmReturn = async () => {
    if (!returnItem) return;
    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/borrow_items.php?id=${returnItem.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          status: "returned",
          return_condition: returnCondition,
          return_notes: returnNotes,
          admin_id: currentUser?.id
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update status");
      }
      toast.success(result.message || "Item returned successfully");
      setReturnModalOpen(false);
      setReturnItem(null);
      fetchItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const handleBorrowItem = (item: any) => {
    const fullName = [
      currentUser?.first_name,
      currentUser?.middle_name,
      currentUser?.last_name
    ].filter(Boolean).join(' ') || "";
    
    setSelectedItem(item);
    setBorrowFormData({
      borrower_name: fullName,
      borrower_email: currentUser?.email || "",
      quantity: "1",
      return_date: "",
      message: "",
    });
    setBorrowModalOpen(true);
  };

  const handleBorrowSubmit = async () => {
    if (!selectedItem || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/borrow_requests.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          borrower_name: borrowFormData.borrower_name,
          borrower_email: borrowFormData.borrower_email,
          item: selectedItem.name,
          quantity: parseInt(borrowFormData.quantity),
          request_date: new Date().toISOString().split('T')[0],
          return_date: borrowFormData.return_date || "",
          message: borrowFormData.message,
          status: "pending",
          created_by: currentUser?.id,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit borrow request");
      }

      toast.success("Borrow request submitted successfully! Please wait for admin approval.");
      setBorrowModalOpen(false);
      fetchAvailableItems();
    } catch (error: any) {
      toast.error(error.message || "Failed to submit borrow request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/borrow_items.php?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete record");
      }
      toast.success("Record deleted successfully");
      fetchItems();
    } catch (error: any) {
      toast.error("Failed to delete record");
    }
  };

  return (
    <div>
      <NavHeader 
        title={isAdmin ? "Borrowed Items" : "Borrow Items"} 
        subtitle={isAdmin ? "Manage all borrowed equipment and returns" : "Browse and borrow available equipment"}
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
        {isAdmin ? (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Borrowed Items</h2>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Borrow Date</TableHead>
                    <TableHead>Expected Return</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                    </TableRow>
                  ) : items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No borrowed items found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.borrower_name}</TableCell>
                        <TableCell>{item.item}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>{new Date(item.borrow_date).toLocaleDateString()}</TableCell>
                        <TableCell>{item.return_date ? new Date(item.return_date).toLocaleDateString() : "N/A"}</TableCell>
                        <TableCell>
                          {item.status === "borrowed" && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Borrowed
                            </Badge>
                          )}
                          {item.status === "returned" && (
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              Returned
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {item.status === "borrowed" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReturnModal(item)}
                              title="Mark as returned"
                            >
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            title="Delete"
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
        ) : (
        <>
          <div className="space-y-6">
            {/* Tools Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-orange-600" />
                <h2 className="text-2xl font-semibold">Tools</h2>
                <Badge variant="secondary">{tools.length} items</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventoryLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardHeader className="pb-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : tools.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No tools available for borrowing.
                  </div>
                ) : (
                  tools.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {item.category || "Tools"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Available:</span>
                            <p className="text-muted-foreground">{item.quantity || 0}</p>
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>
                            <p className="text-muted-foreground">Tool</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleBorrowItem(item)}
                          disabled={(item.quantity || 0) <= 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Borrow Tool
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Equipment Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h2 className="text-2xl font-semibold">Equipment</h2>
                <Badge variant="secondary">{equipment.length} items</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {inventoryLoading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="animate-pulse">
                      <CardHeader className="pb-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="h-4 bg-muted rounded"></div>
                        <div className="h-4 bg-muted rounded"></div>
                      </CardContent>
                    </Card>
                  ))
                ) : equipment.length === 0 ? (
                  <div className="col-span-full text-center text-muted-foreground py-8">
                    No equipment available for borrowing.
                  </div>
                ) : (
                  equipment.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Cpu className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-base">{item.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {item.category || "Equipment"}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Available:</span>
                            <p className="text-muted-foreground">{item.quantity || 0}</p>
                          </div>
                          <div>
                            <span className="font-medium">Type:</span>
                            <p className="text-muted-foreground">Equipment</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => handleBorrowItem(item)}
                          disabled={(item.quantity || 0) <= 0}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Borrow Equipment
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Your Borrow Records</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <CardHeader className="pb-2">
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="h-4 bg-muted rounded"></div>
                      <div className="h-4 bg-muted rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : items.length === 0 ? (
                <div className="col-span-full text-center text-muted-foreground py-12">
                  No borrow records found.
                </div>
              ) : (
                items
                  .filter(item => item.borrower_email === currentUser?.email)
                  .map((item) => (
                    <Card key={item.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{item.item}</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                              Borrowed by {item.borrower_name}
                            </CardDescription>
                          </div>
                          <Badge 
                            variant={item.status === "Returned" ? "outline" : "secondary"}
                            className={`${
                              item.status === "Returned" 
                                ? "bg-green-100 text-green-800 border-green-200" 
                                : "bg-yellow-100 text-yellow-800 border-yellow-200"
                            }`}
                          >
                            {item.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Quantity:</span>
                            <p className="text-muted-foreground">{item.quantity}</p>
                          </div>
                          <div>
                            <span className="font-medium">Borrow Date:</span>
                            <p className="text-muted-foreground">
                              {new Date(item.borrow_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
        </>
      )}

      {/* Return Modal */}
      <Dialog open={returnModalOpen} onOpenChange={setReturnModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Item as Returned</DialogTitle>
          </DialogHeader>
          {returnItem && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <h4 className="font-medium">{returnItem.item}</h4>
                <p className="text-sm text-muted-foreground">Borrower: {returnItem.borrower_name}</p>
                <p className="text-sm text-muted-foreground">Quantity: {returnItem.quantity}</p>
                <p className="text-sm text-muted-foreground">Borrowed: {new Date(returnItem.borrow_date).toLocaleDateString()}</p>
                <p className="text-sm text-muted-foreground">Due Date: {returnItem.return_date ? new Date(returnItem.return_date).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Return Condition</Label>
                <select id="condition" className="w-full border rounded p-2" value={returnCondition} onChange={(e) => setReturnCondition(e.target.value)}>
                  <option value="good">Good</option>
                  <option value="damaged">Damaged</option>
                  <option value="needs_repair">Needs Repair</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Condition Remarks</Label>
                <Textarea id="notes" placeholder="Add notes about the returned item..." value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setReturnModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleConfirmReturn}>
                  Confirm Return
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Borrow Modal */}
      <Dialog open={borrowModalOpen} onOpenChange={setBorrowModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Borrow Equipment</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium">{selectedItem.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedItem.category}</p>
                  <p className="text-sm text-muted-foreground">Available: {selectedItem.quantity} units</p>
                </div>
                
                <form onSubmit={(e) => { e.preventDefault(); handleBorrowSubmit(); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="1"
                      max={selectedItem.quantity}
                      value={borrowFormData.quantity}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, quantity: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="return_date">Expected Return Date</Label>
                    <Input
                      id="return_date"
                      type="date"
                      value={borrowFormData.return_date}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, return_date: e.target.value })}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Purpose / Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Please describe the purpose of borrowing this item..."
                      value={borrowFormData.message}
                      onChange={(e) => setBorrowFormData({ ...borrowFormData, message: e.target.value })}
                      rows={3}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Provide details about why you need this equipment and how you plan to use it.
                    </p>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={() => setBorrowModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Borrow Item
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default BorrowItems;
