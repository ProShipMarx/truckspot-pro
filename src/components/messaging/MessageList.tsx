import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Message } from "@/hooks/useMessages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
}

export const MessageList = ({ messages, currentUserId }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const downloadFile = async (fileUrl: string, fileName: string) => {
    const { data, error } = await supabase.storage
      .from("message-attachments")
      .download(fileUrl);

    if (error) {
      console.error("Error downloading file:", error);
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4">
        {messages.map((message) => {
          const isSent = message.sender_id === currentUserId;
          return (
            <div
              key={message.id}
              className={`flex ${isSent ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  isSent
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {message.content && <p className="text-sm">{message.content}</p>}
                {message.file_url && message.file_name && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full justify-start"
                    onClick={() => downloadFile(message.file_url!, message.file_name!)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {message.file_name}
                  </Button>
                )}
                <p className="mt-1 text-xs opacity-70">
                  {format(new Date(message.created_at), "MMM d, h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};
