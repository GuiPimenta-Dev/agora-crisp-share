
// This is now an empty hook since all screen share functionality happens through Agora events
// This file is kept to avoid breaking any imports
export function useScreenShareSync() {
  // We no longer need Supabase synchronization for screen sharing
  // All users, including listeners, can see shared screens via Agora's native mechanisms
  return {};
}
