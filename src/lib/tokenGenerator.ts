
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const APP_ID = "59e4804bae414795a2097e9525b27c33";
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

  return RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    privilegeExpiredTs
  );
}
