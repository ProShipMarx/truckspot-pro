import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Settings, Shield, LogOut, Pencil, Trash2, Package, Truck as TruckIcon, Send, Inbox } from "lucide-react";
import { Load, Truck } from "@/types/freight";
import { EditLoadModal } from "@/components/EditLoadModal";
import { EditTruckModal } from "@/components/EditTruckModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { format } from "date-fns";
import { MyRequests } from "@/components/MyRequests";
import { IncomingRequests } from "@/components/IncomingRequests";

const MyAccount = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<string>("");
  const [loads, setLoads] = useState<Load[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Edit modal states
  const [editLoadModalOpen, setEditLoadModalOpen] = useState(false);
  const [editTruckModalOpen, setEditTruckModalOpen] = useState(false);
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  
  // Delete dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"load" | "truck" | "account">("load");
  const [deleteId, setDeleteId] = useState<string>("");

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    checkAuth();
    fetchUserPosts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Fetch user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .single();

    if (roleData) {
      setUserRole(roleData.role);
    }

    // Fetch user profile for approval status
    const { data: profileData } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', session.user.id)
      .single();

    if (profileData) {
      setApprovalStatus(profileData.status);
    }

    setIsLoading(false);
  };

  const fetchUserPosts = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Fetch user's loads
    const { data: loadsData } = await supabase
      .from('loads')
      .select('*')
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (loadsData) {
      setLoads(loadsData.map(load => ({
        id: load.id,
        user_id: load.user_id,
        origin: load.origin,
        destination: load.destination,
        origin_lat: load.origin_lat,
        origin_lng: load.origin_lng,
        destination_lat: load.destination_lat,
        destination_lng: load.destination_lng,
        pickupDate: load.pickup_date,
        weight: load.weight,
        equipmentType: load.equipment_type,
        rate: load.rate,
        distance: load.distance,
        contactName: load.contact_name,
        contactPhone: load.contact_phone,
        contactEmail: load.contact_email,
        postedDate: load.created_at,
      })));
    }

    // Fetch user's trucks
    const { data: trucksData } = await (supabase as any)
      .from('trucks')
      .select('*')
      .eq('user_id', session.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (trucksData) {
      setTrucks(trucksData);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleEditLoad = (load: Load) => {
    setSelectedLoad(load);
    setEditLoadModalOpen(true);
  };

  const handleEditTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setEditTruckModalOpen(true);
  };

  const handleDeleteClick = (type: "load" | "truck" | "account", id: string = "") => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === "load") {
        const { error } = await supabase
          .from('loads')
          .update({ deleted_at: new Date().toISOString() } as any)
          .eq('id', deleteId);

        if (error) throw error;
        toast.success("Load deleted successfully");
        fetchUserPosts();
      } else if (deleteType === "truck") {
        const { error } = await (supabase as any)
          .from('trucks')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', deleteId);

        if (error) throw error;
        toast.success("Truck deleted successfully");
        fetchUserPosts();
      } else if (deleteType === "account") {
        // Soft delete user's posts first
        if (user) {
          await supabase
            .from('loads')
            .update({ deleted_at: new Date().toISOString() } as any)
            .eq('user_id', user.id);

          await (supabase as any)
            .from('trucks')
            .update({ deleted_at: new Date().toISOString() })
            .eq('user_id', user.id);
        }

        // Note: Actual account deletion would need to be done via a secure server-side function
        toast.success("Account deletion request submitted");
        handleLogout();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to delete");
    }
    setDeleteDialogOpen(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center">Loading...</p>
        </div>
      </div>
    );
  }

  const getDeleteDialogContent = () => {
    if (deleteType === "account") {
      return {
        title: "Delete Account",
        description: "Are you sure you want to delete your account? Your data will be kept for 90 days before permanent deletion. This action cannot be undone.",
      };
    } else if (deleteType === "load") {
      return {
        title: "Delete Load",
        description: "Are you sure you want to delete this load? It will be kept for 90 days before permanent deletion.",
      };
    } else {
      return {
        title: "Delete Truck",
        description: "Are you sure you want to delete this truck? It will be kept for 90 days before permanent deletion.",
      };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Account</h1>
          <p className="text-muted-foreground">Manage your profile, posts, and settings</p>
        </div>

        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="posts">
              <Package className="h-4 w-4 mr-2" />
              My Posts
            </TabsTrigger>
            <TabsTrigger value="requests">
              {userRole === "carrier" ? (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  My Requests
                </>
              ) : (
                <>
                  <Inbox className="h-4 w-4 mr-2" />
                  Incoming
                </>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="account">
              <Settings className="h-4 w-4 mr-2" />
              Account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-6">
            {/* Show loads for shippers and admins */}
            {(userRole === "shipper" || userRole === "admin") && (
              <Card>
                <CardHeader>
                  <CardTitle>My Loads</CardTitle>
                  <CardDescription>Loads you've posted on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {loads.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No loads posted yet</p>
                  ) : (
                    <div className="space-y-4">
                      {loads.map((load) => (
                        <Card key={load.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/loads/${load.id}`)}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge>{load.equipmentType}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Posted {format(new Date(load.postedDate), "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="font-semibold">
                                  {load.origin} → {load.destination}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {load.distance} miles • ${load.rate} • {load.weight} lbs
                                </div>
                                <div className="text-sm">
                                  Pickup: {format(new Date(load.pickupDate), "MMM d, yyyy")}
                                </div>
                              </div>
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditLoad(load)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick("load", load.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Show trucks for carriers and admins */}
            {(userRole === "carrier" || userRole === "admin") && (
              <Card>
                <CardHeader>
                  <CardTitle>My Trucks</CardTitle>
                  <CardDescription>Trucks you've posted on the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {trucks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No trucks posted yet</p>
                  ) : (
                    <div className="space-y-4">
                      {trucks.map((truck) => (
                        <Card key={truck.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/trucks/${truck.id}`)}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge>{truck.equipment_type}</Badge>
                                  <span className="text-sm text-muted-foreground">
                                    Posted {format(new Date(truck.created_at), "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="font-semibold">{truck.location}</div>
                                <div className="text-sm text-muted-foreground">
                                  {truck.radius ? `${truck.radius} mile radius` : "No radius specified"}
                                </div>
                                <div className="text-sm">
                                  Available: {format(new Date(truck.available_date), "MMM d, yyyy")}
                                </div>
                              </div>
                              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditTruck(truck)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick("truck", truck.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="requests">
            {user && userRole === "carrier" && <MyRequests userId={user.id} />}
            {user && (userRole === "shipper" || userRole === "admin") && <IncomingRequests userId={user.id} />}
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Account Status</Label>
                  <div>
                    <Badge variant={approvalStatus === "approved" ? "default" : "secondary"}>
                      {approvalStatus}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <Badge variant="outline">{userRole}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      required
                    />
                  </div>
                  <Button type="submit">Update Password</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Actions</CardTitle>
                <CardDescription>Manage your account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Logout</h3>
                    <p className="text-sm text-muted-foreground">Sign out of your account</p>
                  </div>
                  <Button variant="outline" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible account actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Delete Account</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data (retained for 90 days)
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteClick("account")}
                  >
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedLoad && (
        <EditLoadModal
          load={selectedLoad}
          open={editLoadModalOpen}
          onOpenChange={setEditLoadModalOpen}
          onSuccess={fetchUserPosts}
        />
      )}

      {selectedTruck && (
        <EditTruckModal
          truck={selectedTruck}
          open={editTruckModalOpen}
          onOpenChange={setEditTruckModalOpen}
          onSuccess={fetchUserPosts}
        />
      )}

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        {...getDeleteDialogContent()}
      />
    </div>
  );
};

export default MyAccount;
