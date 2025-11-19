import { Card } from "@/components/ui/card";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { useMessages } from "@/hooks/useMessages";

interface ThreadViewProps {
  conversationId: string;
  otherUserEmail: string;
  currentUserId: string;
}

export const ThreadView = ({
  conversationId,
  otherUserEmail,
  currentUserId,
}: ThreadViewProps) => {
  const { messages, loading, sendMessage } = useMessages(conversationId);

  if (loading) {
    return (
      <Card className="h-full p-4">
        <p className="text-center text-muted-foreground">Loading messages...</p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{otherUserEmail}</h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <MessageList messages={messages} currentUserId={currentUserId} />
      </div>
      <div className="p-4 border-t">
        <MessageInput onSendMessage={sendMessage} />
      </div>
    </Card>
  );
};
