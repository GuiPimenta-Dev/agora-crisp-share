
import React from "react";
import { useAgora, AgoraProvider } from "@/context/AgoraContext";
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

const Index = () => {
  return (
    <AgoraProvider>
      <MeetingContainer />
    </AgoraProvider>
  );
};

export default Index;
