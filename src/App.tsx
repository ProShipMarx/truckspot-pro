import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PostLoad from "./pages/PostLoad";
import PostTruck from "./pages/PostTruck";
import FindLoads from "./pages/FindLoads";
import FindTrucks from "./pages/FindTrucks";
import LoadDetail from "./pages/LoadDetail";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import SignupCarrier from "./pages/SignupCarrier";
import SignupShipper from "./pages/SignupShipper";
import SignupReceiver from "./pages/SignupReceiver";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PendingApproval from "./pages/PendingApproval";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import MyAccount from "./pages/MyAccount";
import MessagingHub from "./pages/MessagingHub";
import ClaimDelivery from "./pages/ClaimDelivery";
import Favorites from "./pages/Favorites";
import MyLoads from "./pages/MyLoads";
import ReceiverDashboard from "./pages/ReceiverDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/signup-carrier" element={<SignupCarrier />} />
          <Route path="/signup-shipper" element={<SignupShipper />} />
          <Route path="/signup-receiver" element={<SignupReceiver />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/post-load" element={<PostLoad />} />
          <Route path="/post-truck" element={<PostTruck />} />
          <Route path="/find-loads" element={<FindLoads />} />
          <Route path="/loads/:id" element={<LoadDetail />} />
          <Route path="/find-trucks" element={<FindTrucks />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/messages" element={<MessagingHub />} />
          <Route path="/claim-delivery" element={<ClaimDelivery />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/my-loads" element={<MyLoads />} />
          <Route path="/my-deliveries" element={<ReceiverDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
