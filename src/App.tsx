
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MeetingPage from "./pages/MeetingPage";
import MeetingApiRoutes from "./api/MeetingApiRoutes";
import { AgoraProvider } from "./context/AgoraContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AgoraProvider>
        <MeetingApiRoutes />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/meeting/:meetingId" element={<MeetingPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </AgoraProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
