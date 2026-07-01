import { AccessToken } from 'livekit-server-sdk';

export interface LiveKitTokenResponse {
  token: string;
  url: string;
  identity: string;
  roomName: string;
}

/**
 * Generate LiveKit access token for a user to join a room
 * @param roomName - The LiveKit room name
 * @param identity - User identity in format: `user-${userId}`
 * @returns Promise with token data including token, url, identity, and roomName
 */
export const generateLiveKitToken = async (
  roomName: string,
  identity: string
): Promise<LiveKitTokenResponse> => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_URL || 'wss://your-server.livekit.cloud';

  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API key and secret must be configured in environment variables');
  }

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  return {
    token: await token.toJwt(),
    url: livekitUrl,
    identity,
    roomName,
  };
};
