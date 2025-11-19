import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ConversationDetails {
  id: string;
  other_user_id: string;
  other_user_email: string;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

export const useConversations = (currentUserId: string | null) => {
  const [conversations, setConversations] = useState<ConversationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        // Fetch all conversations where user is a participant
        const { data: convos, error: convosError } = await supabase
          .from("conversations")
          .select("*")
          .or(`shipper_id.eq.${currentUserId},carrier_id.eq.${currentUserId}`)
          .order("updated_at", { ascending: false });

        if (convosError) throw convosError;

        if (!convos || convos.length === 0) {
          setConversations([]);
          setLoading(false);
          return;
        }

        // Get details for each conversation
        const conversationDetails = await Promise.all(
          convos.map(async (convo) => {
            const otherUserId =
              convo.shipper_id === currentUserId
                ? convo.carrier_id
                : convo.shipper_id;

            // Get other user's email
            const { data: profile } = await supabase
              .from("profiles")
              .select("email")
              .eq("id", otherUserId)
              .single();

            // Get last message
            const { data: lastMsg } = await supabase
              .from("messages")
              .select("content, created_at")
              .eq("conversation_id", convo.id)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            // Get unread count
            const { count: unreadCount } = await supabase
              .from("messages")
              .select("*", { count: "exact", head: true })
              .eq("conversation_id", convo.id)
              .neq("sender_id", currentUserId)
              .is("read_at", null);

            return {
              id: convo.id,
              other_user_id: otherUserId,
              other_user_email: profile?.email || "Unknown",
              last_message: lastMsg?.content || null,
              last_message_time: lastMsg?.created_at || null,
              unread_count: unreadCount || 0,
            };
          })
        );

        setConversations(conversationDetails);
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

    fetchConversations();

    // Subscribe to new messages to update conversations list
    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
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
  }, [currentUserId, toast]);

  return { conversations, loading };
};
