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

    // Validate roles: shipper <-> carrier only
    const { data: myRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const { data: theirRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", recipientId)
      .single();

    if (!myRole || !theirRole) {
      toast({
        title: "Error",
        description: "Could not verify user roles",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const validPairs = [
      { my: "shipper", their: "carrier" },
      { my: "carrier", their: "shipper" },
    ];

    const isValid = validPairs.some(
      (pair) => myRole.role === pair.my && theirRole.role === pair.their
    );

    if (!isValid) {
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
    const isShipper = myRole.role === "shipper";
    const shipperId = isShipper ? user.id : recipientId;
    const carrierId = isShipper ? recipientId : user.id;

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
