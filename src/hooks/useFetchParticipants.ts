
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MeetingUser } from "@/types/meeting";

type ParticipantWithTimestamp = MeetingUser & {
  joinedAt: string;
};

/**
 * Hook for fetching meeting participants with their profile data
 */
export function useFetchParticipants(meetingId?: string) {
  const [participants, setParticipants] = useState<Record<string, ParticipantWithTimestamp>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          throw new Error(participantsError.message);
        }
        
        console.log("Raw participants data:", participantsData);

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
          
          participantsData.forEach((participant: any) => {
            const profile = profilesMap.get(participant.user_id);
            
            combinedParticipants[participant.user_id] = {
              id: participant.user_id,
              name: profile?.summoner || profile?.name || `User-${participant.user_id.substring(0, 4)}`,
              avatar: profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name || "User")}&background=random`,
              role: participant.role as any,
              audioEnabled: participant.audio_enabled,
              audioMuted: participant.audio_muted !== undefined ? participant.audio_muted : true, // Default to muted if not specified
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
  }, [meetingId]);

  return { participants, setParticipants, isLoading, error };
}
