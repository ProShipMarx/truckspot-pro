import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

type ApprovalStatus = "pending" | "approved" | "rejected" | null;
type UserRole = "admin" | "carrier" | "shipper" | null;

export const useApprovalStatus = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<ApprovalStatus>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setUser(null);
        setStatus(null);
        setLoading(false);
        return;
      }

      setUser(session.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", session.user.id)
        .maybeSingle();

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .maybeSingle();

      setStatus(profile?.status as ApprovalStatus || null);
      setUserRole(roleData?.role as UserRole || null);
      setLoading(false);

      // Redirect pending users to pending page if not already there
      if (profile?.status === "pending" && window.location.pathname !== "/pending-approval") {
        navigate("/pending-approval");
      }

      // Redirect rejected users to login
      if (profile?.status === "rejected") {
        await supabase.auth.signOut();
        navigate("/auth");
      }
    };

    checkStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkStatus();
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return { user, status, userRole, loading, isApproved: status === "approved" };
};
