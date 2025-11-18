import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MessageSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConversationWithDetails {
  id: string;
  shipper_id: string;
  carrier_id: string;
  updated_at: string;
  other_user_email: string;
  other_user_id: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

const Conversations = () => {
  const navigate = useNavigate();
  const { user, isApproved } = useApprovalStatus();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !isApproved) {
      navigate("/auth");
      return;
    }

    fetchConversations();

    // Subscribe to conversation updates
    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isApproved, navigate]);

  const fetchConversations = async () => {
    if (!user) return;

    try {
      // Fetch all conversations where user is a participant
      const { data: convos, error: convosError } = await supabase
        .from("conversations")
        .select("*")
        .or(`shipper_id.eq.${user.id},carrier_id.eq.${user.id}`)
        .order("updated_at", { ascending: false });

      if (convosError) throw convosError;

      if (!convos || convos.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Fetch details for each conversation
      const conversationsWithDetails = await Promise.all(
        convos.map(async (convo) => {
          const otherUserId = convo.shipper_id === user.id ? convo.carrier_id : convo.shipper_id;

          // Get other user's email
          const { data: profile } = await supabase
            .from("profiles")
            .select("email")
            .eq("id", otherUserId)
            .maybeSingle();

          // Get last message
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at")
            .eq("conversation_id", convo.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          // Count unread messages (messages from other user that haven't been read)
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", convo.id)
            .eq("sender_id", otherUserId)
            .is("read_at", null);

          return {
            id: convo.id,
            shipper_id: convo.shipper_id,
            carrier_id: convo.carrier_id,
            updated_at: convo.updated_at,
            other_user_email: profile?.email || "Unknown User",
            other_user_id: otherUserId,
            last_message: lastMsg?.content || null,
            last_message_time: lastMsg?.created_at || null,
            unread_count: unreadCount || 0,
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (otherUserId: string) => {
    navigate(`/messages?with=${otherUserId}`);
  };

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-6 w-6" />
                My Conversations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations yet</p>
                  <p className="text-sm mt-2">
                    Start a conversation by clicking "Contact" on a load or truck post
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((convo) => (
                    <div
                      key={convo.id}
                      onClick={() => handleConversationClick(convo.other_user_id)}
                      className="p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">
                              {convo.other_user_email}
                            </h3>
                            {convo.unread_count > 0 && (
                              <Badge variant="default" className="ml-auto">
                                {convo.unread_count}
                              </Badge>
                            )}
                          </div>
                          {convo.last_message && (
                            <p className="text-sm text-muted-foreground truncate">
                              {convo.last_message}
                            </p>
                          )}
                        </div>
                        {convo.last_message_time && (
                          <span className="text-xs text-muted-foreground ml-4 flex-shrink-0">
                            {format(new Date(convo.last_message_time), "MMM d, h:mm a")}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Conversations;
