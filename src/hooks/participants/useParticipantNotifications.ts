import { useRef } from "react";
import { toast } from "@/hooks/use-toast";

/**
 * Hook to manage participant notifications and prevent duplicates
 */
export function useParticipantNotifications() {
  // Use ref for notifiedUsers to persist across rerenders
  const notifiedUsersRef = useRef<Set<string>>(new Set<string>());
  
  // Track update timestamps to detect potential status updates vs actual joins
  const statusUpdateTimestampRef = useRef<Record<string, number>>({});
  
  // Track whether a recent notification for a user was shown (any type)
  const recentlyNotifiedRef = useRef<Record<string, number>>({});
  
  // Keep track of users we've already seen to prevent notifications on UPDATE events
  const knownUsersRef = useRef<Set<string>>(new Set<string>());
  
  // Add a new ref to track update timestamps with specific fields
  const lastFieldUpdateRef = useRef<Record<string, Record<string, number>>>({});
  
  // Function to check if a specific field has recently been updated
  const hasRecentFieldUpdate = (userId: string, field: string): boolean => {
    const now = Date.now();
    const userUpdates = lastFieldUpdateRef.current[userId] || {};
    const lastUpdate = userUpdates[field] || 0;
    const timeDiff = now - lastUpdate;
    
    // If we got another update for the same field in less than 5000ms,
    // this might be a duplicate or race condition
    if (timeDiff < 5000) {
      console.log(`Recent update for user ${userId} field ${field} (${timeDiff}ms ago)`);
      return true;
    }
    
    // Record this update time for the specific field
    if (!lastFieldUpdateRef.current[userId]) {
      lastFieldUpdateRef.current[userId] = {};
    }
    lastFieldUpdateRef.current[userId][field] = now;
    return false;
  };
  
  // Function to check if this might be a duplicate update
  const isDuplicateUpdate = (userId: string): boolean => {
    const now = Date.now();
    const lastUpdate = statusUpdateTimestampRef.current[userId] || 0;
    const timeDiff = now - lastUpdate;
    
    // If we got another update for the same user in less than 3000ms, 
    // consider it a potential duplicate
    if (timeDiff < 3000) {
      console.log(`Potential duplicate update for user ${userId} (${timeDiff}ms since last update)`);
      return true;
    }
    
    // Record this update time
    statusUpdateTimestampRef.current[userId] = now;
    return false;
  };
  
  // Helper function to determine if we should show a notification
  const shouldShowNotification = (userId: string, type: string): boolean => {
    const now = Date.now();
    const lastNotified = recentlyNotifiedRef.current[userId] || 0;
    const timeDiff = now - lastNotified;
    
    // Only show notifications once every 10 seconds for the same user
    if (timeDiff < 10000) {
      console.log(`Skipping ${type} notification for ${userId} (${timeDiff}ms since last notification)`);
      return false;
    }
    
    // Update the last notification time
    recentlyNotifiedRef.current[userId] = now;
    return true;
  };

  // Show join notification
  const showJoinNotification = (userId: string, participantName: string): void => {
    if (!notifiedUsersRef.current.has(userId) && shouldShowNotification(userId, 'join')) {
      toast({
        title: "Participant joined",
        description: `${participantName} joined the meeting`
      });
      
      // Add to notified users set to avoid duplicate notifications
      notifiedUsersRef.current.add(userId);
    }
  };

  // Show leave notification
  const showLeaveNotification = (userId: string, participantName: string): void => {
    if (shouldShowNotification(userId, 'leave')) {
      toast({
        title: "Participant left",
        description: `${participantName} left the meeting`
      });
    }
  };

  // Mark user as known
  const markUserAsKnown = (userId: string): void => {
    knownUsersRef.current.add(userId);
  };

  // Check if user is known
  const isUserKnown = (userId: string): boolean => {
    return knownUsersRef.current.has(userId);
  };

  // Remove user from known users
  const removeUserFromKnown = (userId: string): void => {
    knownUsersRef.current.delete(userId);
    notifiedUsersRef.current.delete(userId);
  };

  return {
    hasRecentFieldUpdate,
    isDuplicateUpdate,
    shouldShowNotification,
    showJoinNotification,
    showLeaveNotification,
    markUserAsKnown,
    isUserKnown,
    removeUserFromKnown
  };
}
