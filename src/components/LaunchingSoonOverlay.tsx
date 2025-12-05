import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Rocket, Mail, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const LaunchingSoonOverlay = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    
    // Simulate submission - in production, this would save to a database
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsSubmitted(true);
    setIsLoading(false);
    toast.success("You're on the list! We'll notify you at launch.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Greyed out backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />
      
      {/* Popup card */}
      <Card className="relative z-10 w-full max-w-md mx-4 shadow-2xl border-2">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Launching Soon!</CardTitle>
          <CardDescription className="text-base mt-2">
            We're working hard to bring you the best freight matching platform. Be the first to know when we go live.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-muted-foreground">
                  Don't miss our launch — enter your email for all updates
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? "Subscribing..." : "Notify Me"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-medium">You're on the list!</p>
              <p className="text-sm text-muted-foreground mt-1">
                We'll send you an email when we launch.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LaunchingSoonOverlay;
