
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";
import { AgoraProvider } from "./context/AgoraContext";
import { Toaster } from "./components/ui/toaster";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import MeetingPage from "./pages/MeetingPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import JoinMeeting from "./pages/JoinMeeting";
import MeetingApiRoutes from "./api/MeetingApiRoutes";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <BrowserRouter>
        <AgoraProvider>
          {/* API Routes Handler */}
          <MeetingApiRoutes />
          
          <TooltipProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/join" element={<JoinMeeting />} />
              <Route path="/meeting/:meetingId" element={<MeetingPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
          
          <Toaster />
        </AgoraProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
