import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useReceiverLinks } from '@/hooks/useDeliveryConfirmation';
import { supabase } from '@/integrations/supabase/client';
import { Link as LinkIcon, Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface GenerateReceiverCodeProps {
  loadId: string;
}

export const GenerateReceiverCode = ({ loadId }: GenerateReceiverCodeProps) => {
  const { receiverLink, isLoading, generateReceiverLink } = useReceiverLinks(loadId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in');
        return;
      }

      await generateReceiverLink(user.id);
    } catch (error: any) {
      console.error('Error generating code:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!receiverLink?.confirmation_code) return;
    navigator.clipboard.writeText(receiverLink.confirmation_code);
    setCopied(true);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Already has a receiver link
  if (receiverLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LinkIcon className="h-4 w-4 text-primary" />
            Receiver Confirmation Code
          </CardTitle>
          <CardDescription>
            Share this code with the receiver to link them to this delivery
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-muted/50 rounded-lg p-3 font-mono text-xl tracking-widest text-center">
              {receiverLink.confirmation_code}
            </div>
            <Button variant="outline" size="icon" onClick={handleCopy}>
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          
          {receiverLink.claimed_at ? (
            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 p-2 rounded">
              <CheckCircle2 className="h-4 w-4" />
              Receiver has linked to this delivery
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Waiting for receiver to claim this code
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // No receiver link yet
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LinkIcon className="h-4 w-4 text-primary" />
          Link a Receiver
        </CardTitle>
        <CardDescription>
          Generate a confirmation code to link a receiver to this delivery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4 mr-2" />
              Generate Receiver Code
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
