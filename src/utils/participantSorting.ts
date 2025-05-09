
import { MeetingUser, Role } from "@/types/meeting";

/**
 * Sort participants by role priority and join time
 * 
 * This function follows the JavaScript Array.sort() comparison function pattern,
 * returning a number to indicate sort order between two elements.
 */
export function sortParticipantsByRoleAndTime(a: MeetingUser, b: MeetingUser): number {
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
  
  // If we have joinedAt timestamps, sort by them
  if ('joinedAt' in a && 'joinedAt' in b) {
    return new Date((a as any).joinedAt).getTime() - new Date((b as any).joinedAt).getTime();
  }
  
  // Fallback to sort by name
  return a.name.localeCompare(b.name);
}
