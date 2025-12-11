import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User as UserIcon, Eye, EyeOff, Key } from "lucide-react";
import { toast } from "sonner";
import NavHeader from "@/components/NavHeader";
import NotificationProfile from "@/components/NotificationProfile";
import { useWebSocket } from "@/hooks/useWebSocket";

interface StoredUser {
  id: string;
  email: string;
  role?: string;
  avatar_url?: string;
  id_number?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    id_number: "",
    role: "",
  });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
  const loggedInUser = storedUser ? JSON.parse(storedUser) : null;

  // WebSocket notifications
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    loadMoreNotifications, 
    hasMoreNotifications, 
    totalNotifications,
    removeNotification,
    clearAllNotifications
  } = useWebSocket(
    loggedInUser?.id || "",
    loggedInUser?.role || ""
  );

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }

    const currentUser: StoredUser = JSON.parse(stored);
    const targetUserId = searchParams.get("user");

    if (targetUserId && currentUser.role === "admin") {
      // Admin is editing another user's profile
      fetchUser(targetUserId);
    } else {
      // User is viewing their own profile - always fetch fresh data from database
      fetchUser(currentUser.id);
    }
  }, [navigate, searchParams]);

  const fetchUser = async (userId: string) => {
    try {
      // Use the new individual user endpoint
      const response = await fetch(`http://localhost/labmate-guardian-main/api/users.php?id=${userId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        const targetUser = result.data[0]; // Direct access since API returns array with single user
        if (targetUser) {
          // Convert 'user' role from database to 'student' for frontend
          const frontendUser = {
            ...targetUser,
            role: targetUser.role === 'user' ? 'student' : targetUser.role
          };
          setUser(frontendUser);
          setFormData({
            email: frontendUser.email,
            first_name: frontendUser.first_name || "",
            middle_name: frontendUser.middle_name || "",
            last_name: frontendUser.last_name || "",
            id_number: frontendUser.id_number || "",
            role: frontendUser.role || "",
          });

          // Update localStorage if user is viewing their own profile
          const stored = localStorage.getItem("user");
          const currentUser = stored ? JSON.parse(stored) : null;
          if (currentUser && currentUser.id === userId) {
            localStorage.setItem("user", JSON.stringify(frontendUser));
          }
        } else {
          throw new Error("User not found");
        }
      } else {
        throw new Error(result.error || "Failed to fetch user");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch user");
    } finally {
      setLoading(false);
    }
  };

  const validateIdNumber = (idNumber: string): boolean => {
    const idPattern = /^\d{4}-\d{4}$/;
    return idPattern.test(idNumber);
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1 rounded border text-sm hover:bg-muted"
          >
            Back
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Loading...</h1>
            <p className="text-muted-foreground">Fetching profile information</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isEditingOtherUser = searchParams.get("user") && user.id !== JSON.parse(localStorage.getItem("user") || "{}").id;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const formData = new FormData();
    formData.append("user_id", user.id);
    formData.append("avatar", file);

    try {
      setUploading(true);
      const response = await fetch("http://localhost/labmate-guardian-main/api/upload_avatar.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to upload avatar");
      }

      const updated: StoredUser = { ...user, avatar_url: result.avatar_url };
      setUser(updated);
      localStorage.setItem("user", JSON.stringify(updated));
      toast.success("Profile picture updated");
      // Force refresh to update dropdown avatar
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      email: user.email,
      first_name: user.first_name || "",
      middle_name: user.middle_name || "",
      last_name: user.last_name || "",
      id_number: user.id_number || "",
      role: user.role || "",
    });
  };

  const handlePasswordReset = async () => {
    if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
      toast.error("All password fields are required");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.new_password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const response = await fetch("http://localhost/labmate-guardian-main/api/auth_reset_password.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to reset password");
      }

      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setIsChangingPassword(false);
      toast.success("Password reset successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    }
  };

  const handleSave = async () => {
    if (!validateIdNumber(formData.id_number) && formData.id_number) {
      toast.error("ID number must be in format xxxx-xxxx (e.g., 1234-5678)");
      return;
    }

    try {
      const updateData: any = {
        email: formData.email,
        id_number: formData.id_number,
      };

      // Only include name fields if user is admin
      if (loggedInUser?.role === "admin") {
        updateData.first_name = formData.first_name;
        updateData.middle_name = formData.middle_name;
        updateData.last_name = formData.last_name;
      }

      // Only include role if user is admin
      if (user.role === "admin") {
        updateData.role = formData.role;
      }

      console.log("Sending update data:", updateData);

      const response = await fetch(`http://localhost/labmate-guardian-main/api/users.php?id=${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();
      console.log("API response:", result);

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to update profile");
      }

      // Re-fetch the updated user data to ensure we have the latest information
      await fetchUser(user.id);

      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    }
  };

  return (
    <div>
      <NavHeader 
        title={isEditingOtherUser ? `${user.email}'s Profile` : "Profile"}
        subtitle={isEditingOtherUser ? "View and edit user's account information" : "View your account information"}
        showBackButton={true}
        showHomeButton={true}
      >
        <NotificationProfile 
          notifications={notifications}
          unreadCount={unreadCount}
          currentUser={loggedInUser}
          markAllAsRead={markAllAsRead}
          loadMoreNotifications={loadMoreNotifications}
          hasMoreNotifications={hasMoreNotifications}
          totalNotifications={totalNotifications}
          removeNotification={removeNotification}
          clearAllNotifications={clearAllNotifications}
        />
      </NavHeader>
      <div className="container mx-auto p-6 pt-20">

      <Card>
        <CardHeader>
          <CardTitle>Security Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isChangingPassword ? (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Password</Label>
                <p className="text-xs text-muted-foreground">
                  Change your account password
                </p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsChangingPassword(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    placeholder="Enter current password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="new_password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new_password"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    placeholder="Enter new password (min 6 characters)"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    placeholder="Confirm new password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsChangingPassword(false);
                  setPasswordData({
                    current_password: "",
                    new_password: "",
                    confirm_password: "",
                  });
                }}>
                  Cancel
                </Button>
                <Button type="button" onClick={handlePasswordReset}>
                  Reset Password
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
              {user.avatar_url ? (
                <img
                  src={`http://localhost/labmate-guardian-main/${user.avatar_url}`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserIcon className="w-10 h-10 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="avatar">Profile picture</Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={uploading}
              />
              <p className="text-xs text-muted-foreground">
                {uploading ? "Uploading..." : "Upload a square image for best results."}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isEditing && (user.role === "admin") ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-background"
              />
            ) : (
              <Input id="email" value={user.email} readOnly className="bg-muted" />
            )}
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Full Name</Label>
            <p className="text-xs text-muted-foreground">
              {loggedInUser?.role === "admin" 
                ? "Edit name fields below" 
                : "Contact an administrator to update your name information"
              }
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                {isEditing && loggedInUser?.role === "admin" ? (
                  <Input
                    id="first_name"
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="First name"
                    className="bg-background"
                  />
                ) : (
                  <Input 
                    id="first_name" 
                    value={user.first_name || "Not set"} 
                    readOnly 
                    className="bg-muted" 
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="middle_name">Middle Name</Label>
                {isEditing && loggedInUser?.role === "admin" ? (
                  <Input
                    id="middle_name"
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    placeholder="Middle name (optional)"
                    className="bg-background"
                  />
                ) : (
                  <Input 
                    id="middle_name" 
                    value={user.middle_name || "Not set"} 
                    readOnly 
                    className="bg-muted" 
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                {isEditing && loggedInUser?.role === "admin" ? (
                  <Input
                    id="last_name"
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="Last name"
                    className="bg-background"
                  />
                ) : (
                  <Input 
                    id="last_name" 
                    value={user.last_name || "Not set"} 
                    readOnly 
                    className="bg-muted" 
                  />
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            {isEditing && (user.role === "admin") ? (
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="role"
                value={user.role ?? "student"}
                readOnly
                className="bg-muted capitalize"
              />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="id_number">ID Number</Label>
            {isEditing ? (
              <Input
                id="id_number"
                value={formData.id_number}
                onChange={(e) => setFormData({ ...formData, id_number: e.target.value })}
                placeholder="1234-5678"
                pattern="\d{4}-\d{4}"
                maxLength={9}
                className="bg-background"
              />
            ) : (
              <Input
                id="id_number"
                value={user.id_number || "Not assigned"}
                readOnly
                className="bg-muted"
              />
            )}
            {isEditing && (
              <p className="text-xs text-muted-foreground">Format: xxxx-xxxx (e.g., 1234-5678)</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="id">User ID</Label>
            <Input id="id" value={user.id} readOnly className="bg-muted font-mono text-xs" />
          </div>
          <div className="pt-2 text-xs text-muted-foreground">
            For security, password changes and other sensitive updates are not implemented yet.
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            {isEditing ? (
              <>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button type="button" onClick={handleEdit}>
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Profile;
