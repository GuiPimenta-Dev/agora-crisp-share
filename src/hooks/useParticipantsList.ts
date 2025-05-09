
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser, Role } from "@/types/meeting";
import { toast } from "@/hooks/use-toast";

type ParticipantWithTimestamp = MeetingUser & {
  joinedAt: string;
};

/**
 * Custom hook for managing the participants list with realtime updates and proper sorting
 */
export function useParticipantsList(meetingId?: string) {
  const [participants, setParticipants] = useState<Record<string, ParticipantWithTimestamp>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch and realtime subscription setup
  useEffect(() => {
    if (!meetingId) {
      setIsLoading(false);
      return;
    }

    const fetchParticipantsWithProfiles = async () => {
      try {
        setIsLoading(true);
        console.log(`Fetching participants for meeting ${meetingId}`);
        
        // First, get all participants for the meeting
        const { data: participantsData, error: participantsError } = await supabase
          .from("meeting_participants")
          .select("*")
          .eq("meeting_id", meetingId);

        if (participantsError) {
          // Fix: Don't try to construct the error, just throw it
          throw new Error(participantsError.message);
        }

        // Get all user profiles for these participants
        const userIds = participantsData.map(p => p.user_id);
        
        // Only fetch profiles if there are participants
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name, summoner, avatar")
            .in("id", userIds);

          if (profilesError) {
            throw new Error(profilesError.message);
          }

          // Create a map of profiles for easy lookup
          const profilesMap = new Map();
          profilesData?.forEach(profile => {
            profilesMap.set(profile.id, profile);
          });

          // Combine participant data with profile data
          const combinedParticipants: Record<string, ParticipantWithTimestamp> = {};
          
          participantsData.forEach(participant => {
            const profile = profilesMap.get(participant.user_id);
            
            combinedParticipants[participant.user_id] = {
              id: participant.user_id,
              name: profile?.summoner || profile?.name || `User-${participant.user_id.substring(0, 4)}`,
              avatar: profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=random`,
              role: participant.role as Role,
              audioEnabled: participant.audio_enabled,
              screenSharing: participant.screen_sharing || false,
              joinedAt: participant.created_at
            };
          });

          // Set the participants state
          setParticipants(combinedParticipants);
          console.log(`Found ${Object.keys(combinedParticipants).length} participants in meeting ${meetingId}`);
        } else {
          console.log(`No participants found in meeting ${meetingId}`);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching participants:", err);
        setError("Failed to load participants");
        setIsLoading(false);
      }
    };

    fetchParticipantsWithProfiles();

    // Set up realtime subscription with a unique channel name
    const realtimeChannelName = `participants-${meetingId}-${Date.now()}`;
    console.log(`Setting up realtime subscription on channel: ${realtimeChannelName}`);
    
    // Enable realtime for meeting_participants table - this is important
    // to ensure Supabase is broadcasting changes for this table
    supabase.rpc('enable_realtime', { table_name: 'meeting_participants' })
      .then(({ error }) => {
        if (error) console.error("Error enabling realtime:", error.message);
        else console.log("Realtime enabled for meeting_participants table");
      });
    
    const participantsSubscription = supabase
      .channel(realtimeChannelName)
      .on('postgres_changes', { 
        event: '*',
        schema: 'public', 
        table: 'meeting_participants',
        filter: `meeting_id=eq.${meetingId}`
      }, async (payload) => {
        console.log('Realtime participant update received:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newParticipant = payload.new as any;
          
          // Fetch the user profile for the new participant
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name, summoner, avatar")
            .eq("id", newParticipant.user_id)
            .single();
          
          const displayName = profileData?.summoner || profileData?.name || `User-${newParticipant.user_id.substring(0, 4)}`;
          
          // Add the new participant
          setParticipants(prev => ({
            ...prev,
            [newParticipant.user_id]: {
              id: newParticipant.user_id,
              name: displayName,
              avatar: profileData?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`,
              role: newParticipant.role as Role,
              audioEnabled: newParticipant.audio_enabled,
              screenSharing: newParticipant.screen_sharing || false,
              joinedAt: newParticipant.created_at
            }
          }));
          
          toast({
            title: "New participant",
            description: `${displayName} joined the meeting`
          });
        }
        else if (payload.eventType === 'UPDATE') {
          const updatedParticipant = payload.new as any;
          
          // Update the participant's data while preserving other properties
          setParticipants(prev => {
            const existing = prev[updatedParticipant.user_id];
            if (!existing) return prev;
            
            console.log(`Updating participant ${updatedParticipant.user_id}:`, {
              audioEnabled: updatedParticipant.audio_enabled,
              screenSharing: updatedParticipant.screen_sharing
            });
            
            return {
              ...prev,
              [updatedParticipant.user_id]: {
                ...existing,
                audioEnabled: updatedParticipant.audio_enabled,
                screenSharing: updatedParticipant.screen_sharing || false
              }
            };
          });
        }
        else if (payload.eventType === 'DELETE') {
          const deletedParticipant = payload.old as any;
          
          setParticipants(prev => {
            const participant = prev[deletedParticipant.user_id];
            
            if (participant) {
              toast({
                title: "Participant left",
                description: `${participant.name} left the meeting`
              });
            }
            
            const newParticipants = { ...prev };
            delete newParticipants[deletedParticipant.user_id];
            return newParticipants;
          });
        }
      })
      .subscribe((status) => {
        console.log(`Realtime subscription status: ${status}`);
      });

    console.log("Realtime subscription set up for meeting participants");

    // Clean up subscription when component unmounts
    return () => {
      console.log(`Cleaning up realtime subscription for ${realtimeChannelName}`);
      supabase.removeChannel(participantsSubscription);
    };
  }, [meetingId]);

  // Function to sort participants by role and then by join time
  const getSortedParticipants = (): MeetingUser[] => {
    const participantsList = Object.values(participants);
    
    // Sort first by role priority (coach -> student -> listeners)
    // Then by join timestamp within the same role
    return participantsList.sort((a, b) => {
      // Role priority
      const rolePriority: Record<Role, number> = {
        "coach": 1,
        "student": 2,
        "listener": 3
      };
      
      const priorityA = rolePriority[a.role] || 3;
      const priorityB = rolePriority[b.role] || 3;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Same role, sort by join time
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });
  };

  return {
    participants,
    sortedParticipants: getSortedParticipants(),
    isLoading,
    error
  };
}
