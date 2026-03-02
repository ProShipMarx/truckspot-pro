const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SearchParams {
  origin: string;
  destination: string;
  equipment_type: string;
  date_from?: string;
  date_to?: string;
  radius_miles?: number;
  platforms: string[];
}

interface MockLoad {
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

function generateMockResults(params: SearchParams): MockLoad[] {
  const platforms = params.platforms;
  const results: MockLoad[] = [];
  
  const platformNames: Record<string, string> = {
    dat_one: "DAT One",
    truckstop: "Truckstop",
    "123loadboard": "123Loadboard",
    trucker_path: "Trucker Path",
  };

  const companies = [
    "Swift Logistics", "Echo Transport", "XPO Freight", "Schneider",
    "Werner Enterprises", "J.B. Hunt", "Heartland Express", "KLLM Transport",
    "Covenant Transport", "USX Express",
  ];

  for (const platform of platforms) {
    const count = Math.floor(Math.random() * 5) + 2;
    for (let i = 0; i < count; i++) {
      const distance = Math.floor(Math.random() * 1500) + 100;
      const rate = Math.floor(distance * (Math.random() * 1.5 + 1.5));
      const weight = Math.floor(Math.random() * 35000) + 10000;
      const daysOffset = Math.floor(Math.random() * 7);
      const pickupDate = new Date();
      pickupDate.setDate(pickupDate.getDate() + daysOffset);

      results.push({
        platform: platformNames[platform] || platform,
        origin: params.origin,
        destination: params.destination,
        equipment_type: params.equipment_type,
        pickup_date: pickupDate.toISOString().split("T")[0],
        weight,
        rate,
        distance,
        rate_per_mile: parseFloat((rate / distance).toFixed(2)),
        contact: companies[Math.floor(Math.random() * companies.length)],
        posted_at: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
      });
    }
  }

  return results.sort((a, b) => b.rate_per_mile - a.rate_per_mile);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const params: SearchParams = await req.json();

    // Validate required fields
    if (!params.origin || !params.destination || !params.equipment_type || !params.platforms?.length) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: origin, destination, equipment_type, platforms" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the user has credentials for the requested platforms
    const { data: credentials } = await supabase
      .from("carrier_credentials")
      .select("platform")
      .eq("user_id", userId)
      .eq("is_active", true)
      .in("platform", params.platforms);

    const activePlatforms = credentials?.map((c: { platform: string }) => c.platform) || [];

    if (activePlatforms.length === 0) {
      return new Response(
        JSON.stringify({ error: "No active credentials found for the selected platforms" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create search record
    const { data: search, error: searchError } = await supabase
      .from("broker_searches")
      .insert({
        user_id: userId,
        origin: params.origin,
        destination: params.destination,
        equipment_type: params.equipment_type,
        date_from: params.date_from || null,
        date_to: params.date_to || null,
        radius_miles: params.radius_miles || 50,
        platforms_searched: activePlatforms,
        status: "searching",
      })
      .select()
      .single();

    if (searchError) {
      console.error("Failed to create search record:", searchError);
      return new Response(
        JSON.stringify({ error: "Failed to create search record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // TODO: Replace with actual platform automation calls
    // For now, generate mock results
    const mockResults = generateMockResults({ ...params, platforms: activePlatforms });

    // Update search record with results
    await supabase
      .from("broker_searches")
      .update({
        status: "completed",
        results: mockResults,
        results_count: mockResults.length,
        completed_at: new Date().toISOString(),
      })
      .eq("id", search.id);

    return new Response(
      JSON.stringify({
        success: true,
        search_id: search.id,
        platforms_searched: activePlatforms,
        results_count: mockResults.length,
        results: mockResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Broker search error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
