
import React, { useEffect } from "react";
import { IAgoraRTCRemoteUser, UID } from "agora-rtc-sdk-ng";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, Users } from "lucide-react";
import { useAgora } from "@/context/AgoraContext";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface ParticipantsListProps {
  remoteUsers: IAgoraRTCRemoteUser[];
  localUserId?: string;
  screenShareUserId?: UID;
}

const ParticipantsList: React.FC<ParticipantsListProps> = ({
  remoteUsers,
  localUserId = "You",
  screenShareUserId,
}) => {
  const { isMuted, currentUser, participants, setParticipants, agoraState } = useAgora();
  
  // Set up real-time subscription to participant changes
  useEffect(() => {
    if (!agoraState.channelName) return;
    
    console.log("Setting up realtime subscription for participants...");
    
    // Fetch current participants to ensure the list is up-to-date
    const fetchExistingParticipants = async () => {
      try {
        const { data, error } = await supabase
          .from("meeting_participants")
          .select("*")
          .eq("meeting_id", agoraState.channelName);
          
        if (error) {
          console.error("Error fetching participants:", error);
          return;
        }
        
        // Initialize participants state with all existing participants
        const participantsMap = {};
        data.forEach(participant => {
          participantsMap[participant.user_id] = {
            id: participant.user_id,
            name: participant.name,
            avatar: participant.avatar,
            role: participant.role,
            audioEnabled: participant.audio_enabled,
            isCurrent: currentUser?.id === participant.user_id
          };
          
          // Show notification for existing participants 
          // (only for participants other than the current user)
          if (currentUser?.id !== participant.user_id) {
            toast({
              title: "Participant in meeting",
              description: `${participant.name} (${participant.role}) is in the meeting`,
            });
          }
        });
        
        setParticipants(participantsMap);
        console.log("Loaded existing participants:", data.length);
      } catch (err) {
        console.error("Failed to fetch participants:", err);
      }
    };
    
    // First, fetch all existing participants
    fetchExistingParticipants();
    
    // Subscribe to changes in meeting_participants table
    const channel = supabase
      .channel('public:meeting_participants')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'meeting_participants',
          filter: `meeting_id=eq.${agoraState.channelName}`
        },
        (payload) => {
          console.log("Received realtime update:", payload);
          
          // Handle different events
          if (payload.eventType === 'INSERT') {
            const participantData = payload.new;
            
            // Don't notify about ourselves
            if (currentUser?.id !== participantData.user_id) {
              toast({
                title: "Participant joined",
                description: `${participantData.name} (${participantData.role}) joined the meeting`,
              });
            }
            
            setParticipants(prev => ({
              ...prev,
              [participantData.user_id]: {
                id: participantData.user_id,
                name: participantData.name,
                avatar: participantData.avatar,
                role: participantData.role,
                audioEnabled: participantData.audio_enabled,
                isCurrent: currentUser?.id === participantData.user_id
              }
            }));
          } 
          
          if (payload.eventType === 'UPDATE') {
            const participantData = payload.new;
            
            setParticipants(prev => ({
              ...prev,
              [participantData.user_id]: {
                ...prev[participantData.user_id],
                name: participantData.name,
                avatar: participantData.avatar,
                role: participantData.role,
                audioEnabled: participantData.audio_enabled
              }
            }));
          }
          
          if (payload.eventType === 'DELETE') {
            const participantData = payload.old;
            
            // Don't notify about ourselves
            if (currentUser?.id !== participantData.user_id) {
              toast({
                title: "Participant left",
                description: `${participantData.name} (${participantData.role}) left the meeting`,
              });
            }
            
            setParticipants(prev => {
              const newParticipants = { ...prev };
              delete newParticipants[participantData.user_id];
              return newParticipants;
            });
          }
        }
      )
      .subscribe();
      
    console.log("Realtime subscription set up for meeting:", agoraState.channelName);
      
    // Clean up subscription when component unmounts or channel changes
    return () => {
      console.log("Cleaning up realtime subscription");
      supabase.removeChannel(channel);
    };
  }, [agoraState.channelName, currentUser, setParticipants]);
  
  // Get initials from name
  const getInitials = (name: string) => {
    if (!name) return "U";
    
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  // Function to check if a user's audio is active
  const isUserTalking = (userId: string) => {
    const remoteUser = remoteUsers.find(ru => ru.uid.toString() === userId);
    return remoteUser && remoteUser.hasAudio;
  };
  
  return (
    <div className="bg-card rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h3 className="font-medium">Participants ({Object.keys(participants).length})</h3>
      </div>
      
      <ScrollArea className="h-[calc(100vh-280px)]">
        <div className="space-y-1">
          {/* Current User */}
          {currentUser && (
            <div className={`flex items-center gap-3 p-2 rounded-md ${String(screenShareUserId) === currentUser.id ? "bg-secondary/40" : ""}`}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <span className="font-medium">{currentUser.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">({currentUser.role})</span>
                </div>
                {isMuted ? (
                  <MicOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Mic className="h-4 w-4 text-primary" />
                )}
              </div>
            </div>
          )}
          
          {/* Remote Participants */}
          {Object.entries(participants)
            .filter(([id]) => currentUser && id !== currentUser.id)
            .map(([id, user]) => {
              const remoteUser = remoteUsers.find(ru => ru.uid.toString() === id);
              return (
                <div 
                  key={id} 
                  className={`flex items-center gap-3 p-2 rounded-md ${screenShareUserId === id ? "bg-secondary/40" : ""}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex justify-between items-center">
                    <div>
                      <span>{user.name || `User ${id.substring(0, 8)}`}</span>
                      <span className="text-xs text-muted-foreground ml-1">({user.role})</span>
                    </div>
                    {remoteUser && remoteUser.hasAudio ? (
                      <Mic className="h-4 w-4 text-primary" />
                    ) : (
                      <MicOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ParticipantsList;
