import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Package, User, Shield, MessageSquare, Heart, Inbox, Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useApprovalStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
    const linkClass = mobile ? "w-full justify-start" : "";
    
    return (
      <>
        {(userRole === "carrier" || userRole === "admin") && (
          <Button 
            asChild 
            variant={isActive("/find-loads") ? "default" : "ghost"}
            size="sm"
            className={linkClass}
            onClick={closeMobileMenu}
          >
            <Link to="/find-loads">
              <Package className="h-4 w-4 mr-2" />
              Find Loads
            </Link>
          </Button>
        )}
        {(userRole === "shipper" || userRole === "admin") && (
          <Button 
            asChild 
            variant={isActive("/find-trucks") ? "default" : "ghost"}
            size="sm"
            className={linkClass}
            onClick={closeMobileMenu}
          >
            <Link to="/find-trucks">
              <Truck className="h-4 w-4 mr-2" />
              Find Trucks
            </Link>
          </Button>
        )}
        {(userRole === "shipper" || userRole === "admin") && (
          <Button asChild variant="outline" size="sm" className={linkClass} onClick={closeMobileMenu}>
            <Link to="/post-load">Post Load</Link>
          </Button>
        )}
        {(userRole === "carrier" || userRole === "admin") && (
          <Button asChild variant="secondary" size="sm" className={linkClass} onClick={closeMobileMenu}>
            <Link to="/post-truck">Post Truck</Link>
          </Button>
        )}
        {userRole === "admin" && (
          <>
            <Button asChild variant="outline" size="sm" className={linkClass} onClick={closeMobileMenu}>
              <Link to="/admin/dashboard">
                <Shield className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className={linkClass} onClick={closeMobileMenu}>
              <Link to="/admin">
                Admin Panel
              </Link>
            </Button>
          </>
        )}
        {user && (
          <>
            {userRole === "receiver" && (
              <Button asChild variant="ghost" size="sm" className={linkClass} onClick={closeMobileMenu}>
                <Link to="/my-deliveries">
                  <Inbox className="h-4 w-4 mr-2" />
                  My Deliveries
                </Link>
              </Button>
            )}
            {(userRole === "shipper" || userRole === "carrier" || userRole === "admin") && (
              <Button asChild variant="ghost" size="sm" className={linkClass} onClick={closeMobileMenu}>
                <Link to="/my-loads">
                  <Package className="h-4 w-4 mr-2" />
                  My Loads
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className={linkClass} onClick={closeMobileMenu}>
              <Link to="/favorites">
                <Heart className="h-4 w-4 mr-2" />
                Favorites
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className={linkClass} onClick={closeMobileMenu}>
              <Link to="/messages">
                <MessageSquare className="h-4 w-4 mr-2" />
                Messages
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className={linkClass} onClick={closeMobileMenu}>
              <Link to="/my-account">
                <User className="h-4 w-4 mr-2" />
                My Account
              </Link>
            </Button>
          </>
        )}
      </>
    );
  };
  
  return (
    <nav className="border-b bg-card shadow-sm sticky top-0 z-50 safe-top">
      <div className="container mx-auto px-4 safe-horizontal">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Truck className="h-6 w-6 text-secondary" />
            <span className="text-foreground">ProShip</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            <NavLinks />
            {!user && (
              <Button asChild variant="default" size="sm">
                <Link to="/auth">Login</Link>
              </Button>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden flex items-center gap-2">
            {!user && (
              <Button asChild variant="default" size="sm">
                <Link to="/auth">Login</Link>
              </Button>
            )}
            {user && (
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-72">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-secondary" />
                      ProShip
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-2 mt-6">
                    <NavLinks mobile />
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
