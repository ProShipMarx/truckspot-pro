import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Truck, Search, Phone, CheckCircle2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import heroImage from "@/assets/hero-freight.jpg";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";

const Index = () => {
  const { user } = useApprovalStatus();
  const getRoute = (targetRoute: string) => user ? targetRoute : "/auth";
  
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary to-primary/90 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <img 
            src={heroImage} 
            alt="Freight logistics" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-28 relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Connect Freight with Trucks Instantly
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-foreground/90">
              The marketplace where brokers, shippers, and carriers find their perfect match
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" variant="secondary" className="text-lg h-12">
                <Link to={getRoute("/find-loads")}>
                  <Package className="h-5 w-5" />
                  Find Loads
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-lg h-12 bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/20 hover:bg-primary-foreground/20">
                <Link to={getRoute("/find-trucks")}>
                  <Truck className="h-5 w-5" />
                  Find Trucks
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simple steps to connect freight with available trucks
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Post Your Load or Truck</CardTitle>
                <CardDescription>
                  Brokers post freight details, carriers post available equipment
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-8 w-8 text-secondary" />
                </div>
                <CardTitle>Search & Match</CardTitle>
                <CardDescription>
                  Filter by location, equipment type, dates, and distance
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Connect Directly</CardTitle>
                <CardDescription>
                  Contact details displayed - call or email to make a deal
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* For Carriers */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">For Carriers & Owner-Operators</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Find loads that match your truck type and route preferences. No more empty miles.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Search thousands of available loads by location</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Filter by equipment type, weight, and pickup dates</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Direct contact with brokers and shippers</span>
                </li>
              </ul>
              <div className="flex gap-4">
                <Button asChild size="lg">
                  <Link to={getRoute("/find-loads")}>Browse Loads</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={getRoute("/post-truck")}>Post Your Truck</Link>
                </Button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-8 border">
              <div className="aspect-square bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg flex items-center justify-center">
                <Truck className="h-32 w-32 text-primary" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Brokers */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-secondary/5 to-primary/5 rounded-xl p-8 border">
                <div className="aspect-square bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg flex items-center justify-center">
                  <Package className="h-32 w-32 text-secondary" />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">For Freight Brokers & Shippers</h2>
              <p className="text-lg text-muted-foreground mb-6">
                Post your loads and find qualified carriers ready to move your freight.
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Post unlimited loads with full shipment details</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Search available trucks by location and equipment</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <span>Connect directly with carriers and owner-operators</span>
                </li>
              </ul>
              <div className="flex gap-4">
                <Button asChild size="lg" variant="secondary">
                  <Link to={getRoute("/post-load")}>Post a Load</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={getRoute("/find-trucks")}>Find Trucks</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-primary to-primary/90 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-primary-foreground/90 max-w-2xl mx-auto">
            Join thousands of carriers and brokers connecting freight daily
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link to={getRoute("/post-load")}>Post a Load</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/20 hover:bg-primary-foreground/20">
              <Link to={getRoute("/post-truck")}>Post a Truck</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
