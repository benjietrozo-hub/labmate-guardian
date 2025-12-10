import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";

interface User {
  id: string;
  email: string;
  role: "admin" | "student" | "instructor";
  id_number: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  created_at: string;
}

const Users = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const currentUser = storedUser ? JSON.parse(storedUser) : null;
  
  const { notifications, unreadCount, markAllAsRead } = useWebSocket(
    currentUser?.id || "",
    currentUser?.role || ""
  );
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student" as "admin" | "student" | "instructor",
    id_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
  });

  const [editFormData, setEditFormData] = useState({
    email: "",
    role: "student" as "admin" | "student" | "instructor",
    id_number: "",
    first_name: "",
    middle_name: "",
    last_name: "",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const currentUser = storedUser ? JSON.parse(storedUser) : null;
    if (!currentUser || currentUser.role !== "admin") {
      toast.error("You are not authorized to view this page.");
      navigate("/");
      return;
    }

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/users.php");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch users");
      }

      setUsers(result.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const validateIdNumber = (idNumber: string): boolean => {
    const idPattern = /^\d{4}-\d{4}$/;
    return idPattern.test(idNumber);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateIdNumber(formData.id_number)) {
      toast.error("ID number must be in format xxxx-xxxx (e.g., 1234-5678)");
      return;
    }

    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/users.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        id_number: formData.id_number,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
      }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create user");
      }

      toast.success("User created successfully");
      setOpen(false);
      setFormData({ 
        email: "", 
        password: "", 
        role: "student", 
        id_number: "",
        first_name: "",
        middle_name: "",
        last_name: "",
      });
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to create user");
    }
  };

  const handleRoleChange = async (id: string, email: string, role: "admin" | "student" | "instructor") => {
    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/users.php?id=${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        email: editFormData.email,
        role: editFormData.role,
        id_number: editFormData.id_number,
        first_name: editFormData.first_name,
        middle_name: editFormData.middle_name,
        last_name: editFormData.last_name,
      }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update role");
      }

      toast.success("Role updated successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/users.php?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to delete user");
      }

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete user");
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditFormData({ 
      email: user.email, 
      role: user.role, 
      id_number: user.id_number,
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
    });
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!validateIdNumber(editFormData.id_number)) {
      toast.error("ID number must be in format xxxx-xxxx (e.g., 1234-5678)");
      return;
    }

    try {
      const response = await fetch(`http://localhost/labmate-guardian-main/api/users.php?id=${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update user");
      }

      // Check if the edited user is the current logged-in user
      const storedUser = localStorage.getItem("user");
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      
      if (currentUser && currentUser.id === editingUser.id) {
        // Update current user's data in localStorage
        const updatedUser = {
          ...currentUser,
          id_number: editFormData.id_number,
          email: editFormData.email,
          role: editFormData.role,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        
        // Trigger a page re-render to update the UI
        window.location.reload();
      }

      toast.success("User updated successfully");
      setEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update user");
    }
  };

  return (
    <div>
      <NavHeader 
        title="User Management" 
        subtitle="Manage system users and permissions"
        showBackButton={true}
        showHomeButton={true}
      >
        <NotificationProfile 
          notifications={notifications}
          unreadCount={unreadCount}
          currentUser={currentUser}
          markAllAsRead={markAllAsRead}
        />
      </NavHeader>
      <div className="space-y-6 p-6">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>Add User</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="First name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="middle_name">Middle Name</Label>
                      <Input
                        id="middle_name"
                        type="text"
                        value={formData.middle_name}
                        onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                        placeholder="Middle name (optional)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Last name"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id_number">ID Number</Label>
                  <Input
                    id="id_number"
                    value={formData.id_number}
                    onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                    placeholder="1234-5678"
                    pattern="\d{4}-\d{4}"
                    maxLength={9}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Format: xxxx-xxxx (e.g., 1234-5678)</p>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value as "admin" | "student" | "instructor" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>ID Number</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {[user.first_name, user.middle_name, user.last_name]
                        .filter(Boolean)
                        .join(' ') || 'No name set'}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.id_number}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      {user.created_at ? new Date(user.created_at).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/profile?user=${user.id}`)}
                      >
                        View Profile
                      </Button>
                      <Select
                        value={user.role}
                        onValueChange={(value) =>
                          handleRoleChange(user.id, user.email, value as "admin" | "student" | "instructor")
                        }
                      >
                        <SelectTrigger className="w-28 inline-flex mr-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="instructor">Instructor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-4">
                <Label className="text-sm font-medium">Full Name</Label>
                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-first_name">First Name *</Label>
                    <Input
                      id="edit-first_name"
                      type="text"
                      value={editFormData.first_name}
                      onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                      placeholder="First name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-middle_name">Middle Name</Label>
                    <Input
                      id="edit-middle_name"
                      type="text"
                      value={editFormData.middle_name}
                      onChange={(e) => setEditFormData({ ...editFormData, middle_name: e.target.value })}
                      placeholder="Middle name (optional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-last_name">Last Name *</Label>
                    <Input
                      id="edit-last_name"
                      type="text"
                      value={editFormData.last_name}
                      onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-id_number">ID Number</Label>
                <Input
                  id="edit-id_number"
                  value={editFormData.id_number}
                  onChange={(e) => setEditFormData({ ...editFormData, id_number: e.target.value })}
                  placeholder="1234-5678"
                  pattern="\d{4}-\d{4}"
                  maxLength={9}
                  required
                />
                <p className="text-xs text-muted-foreground">Format: xxxx-xxxx (e.g., 1234-5678)</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={editFormData.role}
                  onValueChange={(value) =>
                    setEditFormData({ ...editFormData, role: value as "admin" | "student" | "instructor" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Users;
