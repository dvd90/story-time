import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { AccessToken, type AccessTokenOptions, type VideoGrant } from 'livekit-server-sdk';
import { RoomConfiguration } from '@livekit/protocol';

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

// NOTE: you are expected to define the following environment variables in `.env.local`:
const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// don't cache the results
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    if (LIVEKIT_URL === undefined) {
      throw new Error('LIVEKIT_URL is not defined');
    }
    if (API_KEY === undefined) {
      throw new Error('LIVEKIT_API_KEY is not defined');
    }
    if (API_SECRET === undefined) {
      throw new Error('LIVEKIT_API_SECRET is not defined');
    }

    // Parse agent configuration from request body
    const body = await req.json();
    const agentName: string = body?.room_config?.agents?.[0]?.agent_name;
    
    // Get the user's voice ID from our backend API
    let voiceId: string | undefined = 'SF9uvIlY93SJRMdV5jeP'
    
    // If no voice_id in request, try to fetch from our API
    if (!voiceId) {
      try {
        const { getToken } = await auth();
        const token = await getToken();
        
        if (token) {
          const response = await fetch(`${API_BASE}/api/onboarding/current`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            cache: 'no-store',
          });
          
          if (response.ok) {
            const userData = await response.json();
            voiceId = userData.anamVoiceId;
            console.log(`🎤 Using voice ID from user profile: ${voiceId}`);
          }
        }
      } catch (error) {
        console.warn('Failed to fetch user voice ID:', error);
      }
    }

    // Generate participant token
    const participantName = 'user';
    const participantIdentity = `voice_assistant_user_${Math.floor(Math.random() * 10_000)}`;
    const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10_000)}`;

    const participantToken = await createParticipantToken(
      { identity: participantIdentity, name: participantName },
      roomName,
      agentName,
      voiceId
    );

    // Return connection details
    const data: ConnectionDetails = {
      serverUrl: LIVEKIT_URL,
      roomName,
      participantToken: participantToken,
      participantName,
    };
    const headers = new Headers({
      'Cache-Control': 'no-store',
    });
    return NextResponse.json(data, { headers });
  } catch (error) {
    if (error instanceof Error) {
      console.error(error);
      return new NextResponse(error.message, { status: 500 });
    }
  }
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string,
  agentName?: string,
  voiceId?: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: '15m',
  });
  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  if (agentName) {
    const metadata: Record<string, string> = {};
    if (voiceId) {
      metadata.voice_id = voiceId;
    }

    at.roomConfig = new RoomConfiguration({
      agents: [{ agentName, metadata: JSON.stringify(metadata) }],
    });
  }

  return at.toJwt();
}
