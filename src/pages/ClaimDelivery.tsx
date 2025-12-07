import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/Navigation';
import { ReceiverCodeClaim } from '@/components/delivery/ReceiverCodeClaim';
import { Loader2 } from 'lucide-react';

const ClaimDelivery = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      setIsAuthenticated(true);
      setIsLoading(false);
    };

    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8 max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Claim Delivery</h1>
          <p className="text-muted-foreground">
            Enter your confirmation code to link to a delivery
          </p>
        </div>
        
        <ReceiverCodeClaim />
      </main>
    </div>
  );
};

export default ClaimDelivery;
