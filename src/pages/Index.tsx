
import React from "react";
import { AgoraProvider, useAgora } from "@/context/AgoraContext";
import MeetingJoin from "@/components/MeetingJoin";
import MeetingRoom from "@/components/MeetingRoom";

// Import useAgora here to avoid the "useAgora must be used within an AgoraProvider" error
const MeetingContainer: React.FC = () => {
  const { agoraState } = useAgora();
  
  return (
    <div className="min-h-screen w-full">
      {agoraState.joinState ? <MeetingRoom /> : <MeetingJoin />}
    </div>
  );
};

const Index = () => {
  return (
    <AgoraProvider>
      <MeetingContainer />
    </AgoraProvider>
  );
};

export default Index;
