import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Truck, Activity, TrendingUp } from "lucide-react";
import Navigation from "@/components/Navigation";
import { Load, Truck as TruckType } from "@/types/freight";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userRole, loading: authLoading } = useApprovalStatus();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLoads: 0,
    activeTrucks: 0,
    recentLoads: 0,
    recentTrucks: 0,
  });
  const [recentActivity, setRecentActivity] = useState<{
    loads: Load[];
    trucks: TruckType[];
  }>({
    loads: [],
    trucks: [],
  });

  useEffect(() => {
    if (!authLoading && userRole !== "admin") {
      navigate("/");
    }
  }, [authLoading, userRole, navigate]);

  useEffect(() => {
    if (userRole === "admin") {
      fetchStats();
      fetchRecentActivity();
    }
  }, [userRole]);

  const fetchStats = async () => {
    try {
      // Fetch total loads count
      const { count: loadsCount } = await supabase
        .from("loads")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      // Fetch active trucks count
      const { count: trucksCount } = await supabase
        .from("trucks")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null);

      // Fetch recent loads (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: recentLoadsCount } = await supabase
        .from("loads")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", sevenDaysAgo.toISOString());

      // Fetch recent trucks (last 7 days)
      const { count: recentTrucksCount } = await supabase
        .from("trucks")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", sevenDaysAgo.toISOString());

      setStats({
        totalLoads: loadsCount || 0,
        activeTrucks: trucksCount || 0,
        recentLoads: recentLoadsCount || 0,
        recentTrucks: recentTrucksCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      // Fetch 5 most recent loads
      const { data: loadsData } = await supabase
        .from("loads")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      // Fetch 5 most recent trucks
      const { data: trucksData } = await supabase
        .from("trucks")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      // Map database response to Load type
      const mappedLoads: Load[] = (loadsData || []).map((load) => ({
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
      }));

      setRecentActivity({
        loads: mappedLoads,
        trucks: trucksData || [],
      });
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  if (authLoading || userRole !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Overview of platform statistics and activity</p>
        </div>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Loads</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLoads}</div>
                <p className="text-xs text-muted-foreground">Active load postings</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Trucks</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeTrucks}</div>
                <p className="text-xs text-muted-foreground">Available for dispatch</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Loads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentLoads}</div>
                <p className="text-xs text-muted-foreground">Posted in last 7 days</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Trucks</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.recentTrucks}</div>
                <p className="text-xs text-muted-foreground">Posted in last 7 days</p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Load Postings</CardTitle>
              <CardDescription>Latest 5 loads posted on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.loads.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent loads</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.loads.map((load) => (
                    <div key={load.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm">
                          {load.origin} → {load.destination}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {load.equipmentType} • {load.weight ? `${load.weight} lbs` : 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">${load.rate}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(load.postedDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Truck Postings</CardTitle>
              <CardDescription>Latest 5 trucks posted on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.trucks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No recent trucks</p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.trucks.map((truck) => (
                    <div key={truck.id} className="flex justify-between items-start border-b pb-3 last:border-0">
                      <div>
                        <p className="font-medium text-sm">{truck.location}</p>
                        <p className="text-xs text-muted-foreground">
                          {truck.equipment_type} • {truck.radius ? `${truck.radius} mi radius` : 'Any distance'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          {new Date(truck.available_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Posted {new Date(truck.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
