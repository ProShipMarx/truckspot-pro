import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReceiverLinks } from '@/hooks/useDeliveryConfirmation';
import { supabase } from '@/integrations/supabase/client';
import { Package, Loader2, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const ReceiverCodeClaim = () => {
  const navigate = useNavigate();
  const { claimReceiverLink } = useReceiverLinks();
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to claim a confirmation code');
        navigate('/auth');
        return;
      }

      const result = await claimReceiverLink(code.trim(), user.id);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/my-deliveries');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error claiming code:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-green-400 mb-2">Successfully Linked!</h3>
          <p className="text-muted-foreground">
            Redirecting to your deliveries...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          Link to Delivery
        </CardTitle>
        <CardDescription>
          Enter the confirmation code provided by the shipper to link yourself to a delivery
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Confirmation Code</Label>
            <Input
              id="code"
              placeholder="Enter 8-character code (e.g., A1B2C3D4)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="font-mono text-lg tracking-wider text-center"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={code.length !== 8 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Package className="h-4 w-4 mr-2" />
                Link to Delivery
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
