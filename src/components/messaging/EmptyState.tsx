import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export const EmptyState = () => {
  return (
    <Card className="h-full flex items-center justify-center">
      <div className="text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No conversation selected</h3>
        <p className="text-sm text-muted-foreground">
          Select a conversation from the list to start messaging
        </p>
      </div>
    </Card>
  );
};
