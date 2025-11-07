import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, LogOut } from "lucide-react";
import { toast } from "sonner";

const PendingApproval = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setEmail(session.user.email || "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", session.user.id)
        .maybeSingle();

      if (profile?.status === "approved") {
        navigate("/");
      } else if (profile?.status === "rejected") {
        toast.error("Your account has been rejected");
        await supabase.auth.signOut();
        navigate("/auth");
      }
    };

    checkStatus();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-warning" />
          </div>
          <CardTitle>Account Pending Approval</CardTitle>
          <CardDescription>
            Thank you for signing up! Your account is currently being reviewed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Email:</strong> {email}
            </p>
            <p className="text-sm text-muted-foreground">
              We'll notify you via email once your account has been approved.
            </p>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">What's Next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Our team will review your registration</li>
              <li>You'll receive an email notification when approved</li>
              <li>Once approved, you can access all platform features</li>
            </ul>
          </div>

          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PendingApproval;
