import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { useMessages } from "@/hooks/useMessages";
import { MessageList } from "@/components/messaging/MessageList";
import { MessageInput } from "@/components/messaging/MessageInput";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Messages = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userRole, isApproved } = useApprovalStatus();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  const [otherUserEmail, setOtherUserEmail] = useState<string>("");
  const { messages, loading, sendMessage } = useMessages(conversationId);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !isApproved) {
      navigate("/auth");
      return;
    }

    const recipientId = searchParams.get("with");
    if (!recipientId) {
      toast({
        title: "Error",
        description: "No recipient specified",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setOtherUserId(recipientId);
    initializeConversation(recipientId);
  }, [user, isApproved, navigate, searchParams]);

  const initializeConversation = async (recipientId: string) => {
    if (!user) return;

    // Fetch all roles for both users (users can have multiple roles)
    const { data: myRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const { data: theirRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", recipientId);

    if (!myRoles || !theirRoles || myRoles.length === 0 || theirRoles.length === 0) {
      toast({
        title: "Error",
        description: "Could not verify user roles",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Check if either user is an admin - admins can message anyone
    const myRolesList = myRoles.map(r => r.role);
    const theirRolesList = theirRoles.map(r => r.role);
    const imAdmin = myRolesList.includes("admin");
    const theyAreAdmin = theirRolesList.includes("admin");

    // Validate: admin can message anyone, or must be shipper-carrier pair
    const hasShipper = myRolesList.includes("shipper") || theirRolesList.includes("shipper");
    const hasCarrier = myRolesList.includes("carrier") || theirRolesList.includes("carrier");
    const isValidPair = (hasShipper && hasCarrier) || imAdmin || theyAreAdmin;

    if (!isValidPair) {
      toast({
        title: "Not allowed",
        description: "You can only message between shippers and carriers",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    // Get recipient email for display
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", recipientId)
      .single();

    if (profile) {
      setOtherUserEmail(profile.email);
    }

    // Find or create conversation
    // For admins, we'll place them in the shipper role for conversation purposes
    const myPrimaryRole = imAdmin ? "admin" : myRolesList[0];
    const theirPrimaryRole = theyAreAdmin ? "admin" : theirRolesList[0];
    
    // Determine shipper and carrier IDs
    let shipperId: string;
    let carrierId: string;
    
    if (imAdmin) {
      // If I'm admin, I'm the "shipper" and they're the "carrier"
      shipperId = user.id;
      carrierId = recipientId;
    } else if (theyAreAdmin) {
      // If they're admin, they're the "shipper" and I'm the "carrier"
      shipperId = recipientId;
      carrierId = user.id;
    } else {
      // Normal shipper-carrier pair
      const isShipper = myPrimaryRole === "shipper";
      shipperId = isShipper ? user.id : recipientId;
      carrierId = isShipper ? recipientId : user.id;
    }

    let { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("shipper_id", shipperId)
      .eq("carrier_id", carrierId)
      .single();

    if (!conversation) {
      const { data: newConversation, error } = await supabase
        .from("conversations")
        .insert({ shipper_id: shipperId, carrier_id: carrierId })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive",
        });
        return;
      }
      conversation = newConversation;
    }

    setConversationId(conversation.id);
  };

  if (loading || !conversationId) {
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
      <div className="container mx-auto py-8 px-4">
        <Card className="h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle>Chat with {otherUserEmail}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col h-[calc(100%-5rem)] p-0">
            <MessageList messages={messages} currentUserId={user!.id} />
            <MessageInput onSendMessage={sendMessage} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Messages;
