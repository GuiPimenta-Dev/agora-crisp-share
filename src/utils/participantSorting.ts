
import { MeetingUser, Role } from "@/types/meeting";

type ParticipantWithTimestamp = MeetingUser & {
  joinedAt: string;
};

/**
 * Sort participants by role priority and join time
 */
export function sortParticipantsByRoleAndTime(participants: ParticipantWithTimestamp[]): MeetingUser[] {
  // Sort first by role priority (coach -> student -> listeners)
  // Then by join timestamp within the same role
  return [...participants].sort((a, b) => {
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
}
