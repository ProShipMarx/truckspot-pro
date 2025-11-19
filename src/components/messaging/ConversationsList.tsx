import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import type { ConversationDetails } from "@/hooks/useConversations";

interface ConversationsListProps {
  conversations: ConversationDetails[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string, otherUserId: string) => void;
  loading: boolean;
}

export const ConversationsList = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  loading,
}: ConversationsListProps) => {
  if (loading) {
    return (
      <Card className="h-full p-4">
        <p className="text-center text-muted-foreground">Loading conversations...</p>
      </Card>
    );
  }

  if (conversations.length === 0) {
    return (
      <Card className="h-full p-4">
        <p className="text-center text-muted-foreground">No conversations yet</p>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Messages</h2>
      </div>
      <ScrollArea className="h-[calc(100%-60px)]">
        {conversations.map((convo) => (
          <div
            key={convo.id}
            onClick={() => onSelectConversation(convo.id, convo.other_user_id)}
            className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${
              selectedConversationId === convo.id ? "bg-accent" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{convo.other_user_email}</p>
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
                {convo.last_message_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(convo.last_message_time), {
                      addSuffix: true,
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </Card>
  );
};
