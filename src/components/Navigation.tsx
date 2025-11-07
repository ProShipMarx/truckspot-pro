import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Package, LogOut, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApprovalStatus } from "@/hooks/useApprovalStatus";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useApprovalStatus();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <nav className="border-b bg-card shadow-sm sticky top-0 z-50 safe-top">
      <div className="container mx-auto px-4 safe-horizontal">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl">
            <Truck className="h-6 w-6 text-secondary" />
            <span className="text-foreground">ProShip</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-1">
            <Button 
              asChild 
              variant={isActive("/find-loads") ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/find-loads">
                <Package className="h-4 w-4" />
                Find Loads
              </Link>
            </Button>
            <Button 
              asChild 
              variant={isActive("/find-trucks") ? "default" : "ghost"}
              size="sm"
            >
              <Link to="/find-trucks">
                <Truck className="h-4 w-4" />
                Find Trucks
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/post-load">Post Load</Link>
            </Button>
            <Button asChild variant="secondary" size="sm">
              <Link to="/post-truck">Post Truck</Link>
            </Button>
            
            {userRole === "admin" && (
              <Button asChild variant="outline" size="sm">
                <Link to="/admin">
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Panel
                </Link>
              </Button>
            )}
            
            {user ? (
              <Button variant="ghost" onClick={handleLogout} size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            ) : (
              <Button asChild variant="default" size="sm">
                <Link to="/auth">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
