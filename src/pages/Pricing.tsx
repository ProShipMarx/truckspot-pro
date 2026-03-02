import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Zap, Shield, BarChart3, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";

const Pricing = () => {
  const { user, loading: authLoading } = useApprovalStatus();
  const [searchParams] = useSearchParams();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [subscription, setSubscription] = useState<{ subscribed: boolean; subscription_end: string | null } | null>(null);
  const [isLoadingSub, setIsLoadingSub] = useState(true);

  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  useEffect(() => {
    if (success) toast.success("Subscription activated! Welcome to ProShip Pro.");
    if (canceled) toast.info("Checkout canceled. You can subscribe anytime.");
  }, [success, canceled]);

  useEffect(() => {
    const checkSub = async () => {
      if (!user) { setIsLoadingSub(false); return; }
      try {
        const { data, error } = await supabase.functions.invoke("check-subscription");
        if (error) throw error;
        setSubscription(data);
      } catch { /* ignore */ }
      setIsLoadingSub(false);
    };
    if (!authLoading) checkSub();
  }, [user, authLoading]);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please sign in first to subscribe.");
      return;
    }
    setIsCheckingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    }
    setIsCheckingOut(false);
  };

  const handleManage = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      toast.error("Failed to open subscription management.");
    }
  };

  const features = [
    { icon: Zap, text: "Broker Agent — search loads across DAT, Truckstop, 123Loadboard & more" },
    { icon: BarChart3, text: "Unlimited load & truck posting" },
    { icon: Shield, text: "Direct messaging between carriers and shippers" },
    { icon: CheckCircle2, text: "Delivery confirmation & tracking" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-lg">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">ProShip Pro</h1>
            <p className="text-muted-foreground text-lg">Everything you need to move freight smarter</p>
          </div>

          <Card className={`border-2 ${subscription?.subscribed ? "border-green-500" : "border-primary"}`}>
            <CardHeader className="text-center">
              {subscription?.subscribed && (
                <span className="inline-block bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-2 mx-auto w-fit">
                  Your Plan
                </span>
              )}
              <CardTitle className="text-2xl">Pro Subscription</CardTitle>
              <CardDescription>
                <span className="text-4xl font-bold text-foreground">€39.99</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <f.icon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{f.text}</span>
                </div>
              ))}
            </CardContent>

            <CardFooter className="flex flex-col gap-3">
              {isLoadingSub || authLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
              ) : subscription?.subscribed ? (
                <>
                  <p className="text-sm text-muted-foreground text-center">
                    Renews {subscription.subscription_end ? new Date(subscription.subscription_end).toLocaleDateString() : "—"}
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleManage}>
                    Manage Subscription
                  </Button>
                </>
              ) : (
                <Button className="w-full" size="lg" onClick={handleCheckout} disabled={isCheckingOut}>
                  {isCheckingOut ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Redirecting…</> : "Subscribe Now"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
