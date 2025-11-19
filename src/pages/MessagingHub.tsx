import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { ConversationsList } from "@/components/messaging/ConversationsList";
import { ThreadView } from "@/components/messaging/ThreadView";
import { EmptyState } from "@/components/messaging/EmptyState";
import { useConversations } from "@/hooks/useConversations";
import { useToast } from "@/hooks/use-toast";

export default function MessagingHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [selectedOtherUserId, setSelectedOtherUserId] = useState<string | null>(null);
  const [otherUserEmail, setOtherUserEmail] = useState<string>("");
  const [isApproved, setIsApproved] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const { conversations, loading: conversationsLoading } = useConversations(currentUserId);

  // Check authentication and approval
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setCurrentUserId(session.user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", session.user.id)
        .single();

      if (profile?.status !== "approved") {
        navigate("/pending-approval");
        return;
      }

      setIsApproved(true);
      setAuthLoading(false);
    };

    checkAuth();
  }, [navigate]);

  // Handle ?with=user_id parameter
  useEffect(() => {
    if (!currentUserId || !isApproved) return;

    const withUserId = searchParams.get("with");
    if (withUserId) {
      initializeConversation(withUserId);
    }
  }, [searchParams, currentUserId, isApproved]);

  const initializeConversation = async (recipientId: string) => {
    try {
      // Validate roles before creating conversation
      const { data: currentUserRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUserId);

      const { data: recipientRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", recipientId);

      if (!currentUserRoles || currentUserRoles.length === 0 || !recipientRoles || recipientRoles.length === 0) {
        toast({
          title: "Error",
          description: "Unable to start conversation. User roles not found.",
          variant: "destructive",
        });
        return;
      }

      const currentRoles = currentUserRoles.map(r => r.role);
      const recipientRolesList = recipientRoles.map(r => r.role);

      // Admin can message anyone
      const isAdmin = currentRoles.includes("admin") || recipientRolesList.includes("admin");
      // Shipper-Carrier communication
      const isValidPair = 
        (currentRoles.includes("shipper") && recipientRolesList.includes("carrier")) ||
        (currentRoles.includes("carrier") && recipientRolesList.includes("shipper"));

      if (!isAdmin && !isValidPair) {
        toast({
          title: "Error",
          description: "You can only message between shippers and carriers.",
          variant: "destructive",
        });
        return;
      }

      // Fetch recipient email
      const { data: recipientProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", recipientId)
        .single();

      if (recipientProfile) {
        setOtherUserEmail(recipientProfile.email);
      }

      // Find or create conversation
      const { data: existingConvo } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(shipper_id.eq.${currentUserId},carrier_id.eq.${recipientId}),and(shipper_id.eq.${recipientId},carrier_id.eq.${currentUserId})`
        )
        .maybeSingle();

      if (existingConvo) {
        setSelectedConversationId(existingConvo.id);
        setSelectedOtherUserId(recipientId);
      } else {
        // Create new conversation
        const shipperId = currentRoles.includes("shipper") ? currentUserId : recipientId;
        const carrierId = currentRoles.includes("carrier") ? currentUserId : recipientId;

        const { data: newConvo, error } = await supabase
          .from("conversations")
          .insert({
            shipper_id: shipperId,
            carrier_id: carrierId,
          })
          .select()
          .single();

        if (error) throw error;

        setSelectedConversationId(newConvo.id);
        setSelectedOtherUserId(recipientId);
      }
    } catch (error) {
      console.error("Error initializing conversation:", error);
      toast({
        title: "Error",
        description: "Failed to load conversation",
        variant: "destructive",
      });
    }
  };

  const handleSelectConversation = (conversationId: string, otherUserId: string) => {
    setSelectedConversationId(conversationId);
    setSelectedOtherUserId(otherUserId);
    setSearchParams({ with: otherUserId });

    const convo = conversations.find((c) => c.id === conversationId);
    if (convo) {
      setOtherUserEmail(convo.other_user_email);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto py-8">
          <p className="text-center text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <div className="md:col-span-1">
            <ConversationsList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              loading={conversationsLoading}
            />
          </div>
          <div className="md:col-span-2">
            {selectedConversationId && currentUserId ? (
              <ThreadView
                conversationId={selectedConversationId}
                otherUserEmail={otherUserEmail}
                currentUserId={currentUserId}
              />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
