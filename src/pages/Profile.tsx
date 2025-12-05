import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User as UserIcon } from "lucide-react";
import { toast } from "sonner";

interface StoredUser {
  id: string;
  email: string;
  role?: string;
  avatar_url?: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) {
      navigate("/login");
      return;
    }
    try {
      const parsed: StoredUser = JSON.parse(stored);
      setUser(parsed);
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  if (!user) {
    return null;
  }

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
    } catch (error: any) {
      toast.error(error.message || "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-3 py-1 rounded border text-sm hover:bg-muted"
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="px-3 py-1 rounded border text-sm hover:bg-muted"
          >
            Home
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">View your account information</p>
          </div>
        </div>
      </div>

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
            <Input id="email" value={user.email} readOnly className="bg-muted" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              value={user.role ?? "user"}
              readOnly
              className="bg-muted capitalize"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="id">User ID</Label>
            <Input id="id" value={user.id} readOnly className="bg-muted font-mono text-xs" />
          </div>
          <div className="pt-2 text-xs text-muted-foreground">
            For security, password changes and other sensitive updates are not implemented yet.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
