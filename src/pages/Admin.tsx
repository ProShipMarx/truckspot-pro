import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  role?: string;
};

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRole } = useApprovalStatus();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || userRole !== "admin")) {
      navigate("/");
      toast.error("Access denied. Admin privileges required.");
    }
  }, [user, userRole, authLoading, navigate]);

  useEffect(() => {
    if (userRole === "admin") {
      fetchUsers();
    }
  }, [userRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      const roleMap = new Map(roles?.map((r) => [r.user_id, r.role]) || []);

      const usersWithRoles = profiles?.map((profile) => ({
        ...profile,
        role: roleMap.get(profile.id),
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error("Failed to load users: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, newStatus: "approved" | "rejected") => {
    try {
      setUpdatingUserId(userId);
      const { error } = await supabase
        .from("profiles")
        .update({ status: newStatus })
        .eq("id", userId);

      if (error) throw error;

      toast.success(`User ${newStatus} successfully`);
      await fetchUsers();
    } catch (error: any) {
      toast.error("Failed to update user status: " + error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "default",
      approved: "secondary",
      rejected: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const filterUsers = (status?: string) => {
    if (!status) return users;
    return users.filter((u) => u.status === status);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (userRole !== "admin") {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Panel - User Approvals</h1>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All ({users.length})
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({filterUsers("pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({filterUsers("approved").length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({filterUsers("rejected").length})
            </TabsTrigger>
          </TabsList>

          {["all", "pending", "approved", "rejected"].map((tab) => (
            <TabsContent key={tab} value={tab}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterUsers(tab === "all" ? undefined : tab).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">{user.role || "N/A"}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => updateUserStatus(user.id, "approved")}
                              disabled={updatingUserId === user.id}
                            >
                              {updatingUserId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Approve"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateUserStatus(user.id, "rejected")}
                              disabled={updatingUserId === user.id}
                            >
                              {updatingUserId === user.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Reject"
                              )}
                            </Button>
                          </div>
                        )}
                        {user.status !== "pending" && (
                          <span className="text-muted-foreground text-sm">No action</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {filterUsers(tab === "all" ? undefined : tab).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          ))}
        </Tabs>
      </Card>
    </div>
  );
};

export default Admin;
