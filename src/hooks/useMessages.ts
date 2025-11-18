import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
  read_at: string | null;
  sender_email?: string;
}

export const useMessages = (conversationId: string | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error",
          description: "Failed to load messages",
          variant: "destructive",
        });
      } else {
        setMessages(data || []);
        
        // Mark messages as read (messages that were sent by others and haven't been read yet)
        const currentUserId = (await supabase.auth.getUser()).data.user?.id;
        if (currentUserId && data) {
          const unreadMessageIds = data
            .filter(msg => msg.sender_id !== currentUserId && !msg.read_at)
            .map(msg => msg.id);
          
          if (unreadMessageIds.length > 0) {
            await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .in("id", unreadMessageIds);
          }
        }
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to realtime messages
    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
          
          // Mark as read if it's not from the current user
          const currentUserId = (await supabase.auth.getUser()).data.user?.id;
          if (currentUserId && newMessage.sender_id !== currentUserId && !newMessage.read_at) {
            await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMessage.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, toast]);

  const sendMessage = async (content: string, fileUrl?: string, fileName?: string) => {
    if (!conversationId) return;

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: (await supabase.auth.getUser()).data.user?.id,
      content: content || null,
      file_url: fileUrl || null,
      file_name: fileName || null,
    });

    if (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  return { messages, loading, sendMessage };
};
