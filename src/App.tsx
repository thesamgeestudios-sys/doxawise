import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Staff from "./pages/Staff";
import Payments from "./pages/Payments";
import Cards from "./pages/Cards";
import Transactions from "./pages/Transactions";
import UserSettings from "./pages/UserSettings";
import Admin from "./pages/Admin";
import Terms from "./pages/Terms";
import EmailConfirmed from "./pages/EmailConfirmed";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/email-confirmed" element={<EmailConfirmed />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/staff" element={<Staff />} />
            <Route path="/dashboard/payments" element={<Payments />} />
            <Route path="/dashboard/cards" element={<Cards />} />
            <Route path="/dashboard/transactions" element={<Transactions />} />
            <Route path="/dashboard/settings" element={<UserSettings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
