
import { RtcTokenBuilder, RtcRole } from "agora-access-token";
// Import Buffer from the buffer package
import { Buffer } from "buffer";

// Make Buffer available globally for agora-access-token
// This is needed because the library expects Buffer to be available
window.Buffer = Buffer;

const APP_ID = "52556fe6809a4624b3227a074c550aca";
const APP_CERTIFICATE = "55d06787c77a4e43981b5bf290e91890";

/**
 * Generates an Agora RTC token for authentication
 * @param channelName The name of the channel to join
 * @param uid The user ID (uses 0 for dynamic assignment if not specified)
 * @returns The generated token string
 */
export function generateToken(channelName: string, uid: number = 0): string {
  const expirationTimeInSeconds = 3600; // Token valid for 1 hour
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Ensure channelName is valid
  if (!channelName || channelName.trim() === "") {
    throw new Error("Channel name must not be empty");
  }

  try {
    return RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiredTs
    );
  } catch (error) {
    console.error("Token generation error:", error);
    throw new Error("Failed to generate token. Please check your configuration.");
  }
}

/**
 * Generates a shareable meeting URL
 * @param channelName The channel name
 * @returns The full URL that can be shared with others
 */
export function generateShareableLink(channelName: string): string {
  // Create a URL with the channel name as a query parameter
  const baseUrl = window.location.origin;
  const url = new URL(baseUrl);
  url.searchParams.append("channel", channelName);
  
  return url.toString();
}

/**
 * Extracts channel name from URL if present
 * @returns The channel name from URL or null if not found
 */
export function getChannelFromUrl(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("channel");
}
