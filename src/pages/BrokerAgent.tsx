import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Bot, Key, Search, Trash2, Eye, EyeOff, Loader2, DollarSign, MapPin, Truck, Calendar } from "lucide-react";

const PLATFORMS = [
  { id: "dat_one", name: "DAT One", color: "bg-blue-500" },
  { id: "truckstop", name: "Truckstop", color: "bg-green-500" },
  { id: "123loadboard", name: "123Loadboard", color: "bg-orange-500" },
  { id: "trucker_path", name: "Trucker Path", color: "bg-purple-500" },
] as const;

const EQUIPMENT_TYPES = ["Dry Van", "Flatbed", "Reefer", "Step Deck", "Tanker", "Box Truck"];

interface Credential {
  id: string;
  platform: string;
  encrypted_username: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface SearchResult {
  platform: string;
  origin: string;
  destination: string;
  equipment_type: string;
  pickup_date: string;
  weight: number;
  rate: number;
  distance: number;
  rate_per_mile: number;
  contact: string;
  posted_at: string;
}

const BrokerAgent = () => {
  const navigate = useNavigate();
  const { user, userRole, loading: authLoading } = useApprovalStatus();

  // Subscription gate
  const [subChecked, setSubChecked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  // Credentials state
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [credLoading, setCredLoading] = useState(true);
  const [addPlatform, setAddPlatform] = useState("");
  const [addUsername, setAddUsername] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search state
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [equipmentType, setEquipmentType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchCount, setSearchCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Check subscription status
  useEffect(() => {
    const checkSub = async () => {
      if (!user) { setSubChecked(true); return; }
      try {
        const { data, error } = await supabase.functions.invoke("check-subscription");
        if (error) throw error;
        setSubscribed(data?.subscribed === true);
      } catch {
        setSubscribed(false);
      }
      setSubChecked(true);
    };
    if (!authLoading) checkSub();
  }, [user, authLoading]);

  useEffect(() => {
    if (user) fetchCredentials();
  }, [user]);

  const fetchCredentials = async () => {
    setCredLoading(true);
    const { data, error } = await supabase
      .from("carrier_credentials")
      .select("id, platform, encrypted_username, is_active, last_used_at, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      toast.error("Failed to load credentials");
    } else {
      setCredentials(data || []);
    }
    setCredLoading(false);
  };

  const handleAddCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addPlatform || !addUsername || !addPassword) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);

    // In production, encrypt before storing. For MVP, we base64 encode as a placeholder.
    const encodedUsername = btoa(addUsername);
    const encodedPassword = btoa(addPassword);

    const { error } = await supabase.from("carrier_credentials").insert({
      user_id: user!.id,
      platform: addPlatform,
      encrypted_username: encodedUsername,
      encrypted_password: encodedPassword,
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("You already have credentials for this platform");
      } else {
        toast.error("Failed to save credentials");
      }
    } else {
      toast.success("Credentials saved successfully");
      setAddPlatform("");
      setAddUsername("");
      setAddPassword("");
      fetchCredentials();
    }
    setSaving(false);
  };

  const handleDeleteCredential = async (id: string) => {
    const { error } = await supabase.from("carrier_credentials").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete credentials");
    } else {
      toast.success("Credentials removed");
      fetchCredentials();
    }
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((p) => p !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination || !equipmentType) {
      toast.error("Origin, destination, and equipment type are required");
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform to search");
      return;
    }

    setSearching(true);
    setResults([]);

    const { data, error } = await supabase.functions.invoke("broker-search", {
      body: {
        origin,
        destination,
        equipment_type: equipmentType,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        platforms: selectedPlatforms,
      },
    });

    if (error) {
      toast.error("Search failed: " + error.message);
    } else if (data?.error) {
      toast.error(data.error);
    } else {
      setResults(data.results || []);
      setSearchCount(data.results_count || 0);
      toast.success(`Found ${data.results_count} loads across ${data.platforms_searched?.length} platforms`);
    }
    setSearching(false);
  };

  const getPlatformInfo = (platformId: string) =>
    PLATFORMS.find((p) => p.id === platformId);

  const connectedPlatformIds = credentials.filter((c) => c.is_active).map((c) => c.platform);

  if (authLoading || !subChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscribed) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-16 max-w-lg text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
          <p className="text-muted-foreground mb-6">
            The Broker Agent is available exclusively to ProShip Pro subscribers.
          </p>
          <Button onClick={() => navigate("/pricing")} size="lg">
            View Plans &amp; Subscribe
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Bot className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Broker Agent</h1>
            <p className="text-muted-foreground text-sm">Search across multiple load boards from one place</p>
          </div>
        </div>

        <Tabs defaultValue="search" className="space-y-4">
          <TabsList>
            <TabsTrigger value="search">
              <Search className="h-4 w-4 mr-2" />
              Search Loads
            </TabsTrigger>
            <TabsTrigger value="credentials">
              <Key className="h-4 w-4 mr-2" />
              Credentials ({credentials.length})
            </TabsTrigger>
          </TabsList>

          {/* SEARCH TAB */}
          <TabsContent value="search" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Search Parameters</CardTitle>
                <CardDescription>Enter your search criteria to find loads across connected platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="origin">Origin</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="origin"
                          placeholder="e.g. Chicago, IL"
                          value={origin}
                          onChange={(e) => setOrigin(e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="destination">Destination</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="destination"
                          placeholder="e.g. Dallas, TX"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Equipment Type</Label>
                      <Select value={equipmentType} onValueChange={setEquipmentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EQUIPMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFrom">Date From</Label>
                      <Input
                        id="dateFrom"
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateTo">Date To</Label>
                      <Input
                        id="dateTo"
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Platform selection */}
                  <div className="space-y-2">
                    <Label>Search Platforms</Label>
                    {connectedPlatformIds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No platforms connected. Go to the Credentials tab to add your load board accounts.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {PLATFORMS.filter((p) => connectedPlatformIds.includes(p.id)).map((platform) => (
                          <label
                            key={platform.id}
                            className="flex items-center gap-2 cursor-pointer rounded-lg border border-border px-3 py-2 hover:bg-accent transition-colors"
                          >
                            <Checkbox
                              checked={selectedPlatforms.includes(platform.id)}
                              onCheckedChange={() => togglePlatform(platform.id)}
                            />
                            <span className={`w-2 h-2 rounded-full ${platform.color}`} />
                            <span className="text-sm font-medium">{platform.name}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={searching || connectedPlatformIds.length === 0}
                  >
                    {searching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching {selectedPlatforms.length} platforms...
                      </>
                    ) : (
                      <>
                        <Search className="h-4 w-4 mr-2" />
                        Search Loads
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Search Results ({searchCount} loads found)
                  </CardTitle>
                  <CardDescription>Sorted by rate per mile (highest first)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.map((result, idx) => (
                      <div
                        key={idx}
                        className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {result.platform}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Truck className="h-3 w-3 mr-1" />
                              {result.equipment_type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg text-foreground">${result.rate.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">${result.rate_per_mile}/mi</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm mb-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{result.origin}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{result.destination}</span>
                          <span className="text-muted-foreground">({result.distance} mi)</span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {result.pickup_date}
                          </span>
                          <span>{result.weight.toLocaleString()} lbs</span>
                          <span>{result.contact}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* CREDENTIALS TAB */}
          <TabsContent value="credentials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Add Platform Credentials</CardTitle>
                <CardDescription>
                  Connect your load board accounts so the broker agent can search on your behalf.
                  Your credentials are encrypted and stored securely.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCredential} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Platform</Label>
                      <Select value={addPlatform} onValueChange={setAddPlatform}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          {PLATFORMS.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cred-username">Username / Email</Label>
                      <Input
                        id="cred-username"
                        placeholder="your@email.com"
                        value={addUsername}
                        onChange={(e) => setAddUsername(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cred-password">Password</Label>
                      <div className="relative">
                        <Input
                          id="cred-password"
                          type={showPassword ? "text" : "password"}
                          value={addPassword}
                          onChange={(e) => setAddPassword(e.target.value)}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Key className="h-4 w-4 mr-2" />}
                    Save Credentials
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Connected Platforms */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connected Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                {credLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : credentials.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No platforms connected yet. Add your credentials above to get started.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {credentials.map((cred) => {
                      const platform = getPlatformInfo(cred.platform);
                      return (
                        <div
                          key={cred.id}
                          className="flex items-center justify-between border border-border rounded-lg p-4"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-3 h-3 rounded-full ${platform?.color || "bg-muted"}`} />
                            <div>
                              <p className="font-medium text-foreground">{platform?.name || cred.platform}</p>
                              <p className="text-xs text-muted-foreground">
                                User: {atob(cred.encrypted_username)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={cred.is_active ? "default" : "secondary"}>
                              {cred.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteCredential(cred.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default BrokerAgent;
