import { BaseActionHandler, type HandlerContext } from './base.js';
import { SessionRegistry } from '../managers/session-registry.js';

/**
 * Handler that changes the TTS voice ID for the agent
 *
 * Expected payload:
 * {
 *   voice_id: string - The ElevenLabs voice ID to use
 * }
 */
export class ChangeVoiceHandler extends BaseActionHandler {
  private sessionRegistry: SessionRegistry;

  constructor(sessionRegistry: SessionRegistry) {
    super('change_voice');
    this.sessionRegistry = sessionRegistry;
  }

  override validate(payload: Record<string, unknown> | undefined): boolean {
    if (!payload) return false;
    return typeof payload.voice_id === 'string' && payload.voice_id.length > 0;
  }

  override async handle(context: HandlerContext) {
    const { request, roomName } = context;
    const voiceId = request.payload?.voice_id as string;

    try {
      // Get the session manager from registry
      const sessionContext = this.sessionRegistry.get(roomName);
      if (!sessionContext) {
        return this.error('Session not found for this room');
      }

      // Update the voice ID
      // Note: We need to access the AgentSessionManager, not just the session
      // For now, we'll update via the session context
      // In a future refactor, we could store the AgentSessionManager in the registry

      // Create new TTS with the updated voice
      const { inference } = await import('@livekit/agents');
      const newTts = new inference.TTS({
        model: 'elevenlabs/eleven_turbo_v2_5',
        voice: voiceId,
        language: 'en',
      });

      // Update the session's TTS
      sessionContext.session.tts = newTts;

      console.log(`Voice changed successfully to ${voiceId} for room ${roomName}`);

      return this.success('Voice changed successfully', { voice_id: voiceId });
    } catch (error) {
      console.error('Error in ChangeVoiceHandler:', error);
      return this.error(
        error instanceof Error ? error.message : 'Failed to change voice'
      );
    }
  }
}
