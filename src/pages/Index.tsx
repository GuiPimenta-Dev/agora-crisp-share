
import React from "react";
import { AgoraProvider } from "@/context/AgoraContext";
import MeetingJoin from "@/components/MeetingJoin";
import MeetingRoom from "@/components/MeetingRoom";

const MeetingContainer: React.FC = () => {
  const { agoraState } = useAgora();
  
  return (
    <div className="min-h-screen w-full">
      {agoraState.joinState ? <MeetingRoom /> : <MeetingJoin />}
    </div>
  );
};

// Import useAgora here to avoid the "useAgora must be used within an AgoraProvider" error
import { useAgora } from "@/context/AgoraContext";

const Index = () => {
  return (
    <AgoraProvider>
      <MeetingContainer />
    </AgoraProvider>
  );
};

export default Index;
