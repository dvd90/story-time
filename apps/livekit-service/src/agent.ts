import { type JobContext, type JobProcess, ServerOptions, cli, defineAgent } from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { AgentSessionManager, sessionRegistry } from './managers/index.js';

dotenv.config({ path: '.env.local' });

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    // Preload the VAD model for voice activity detection
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const sessionManager = new AgentSessionManager(ctx, sessionRegistry);
    await sessionManager.initialize();

    console.log(`Agent initialized for room: ${ctx.job.room?.name ?? 'unknown'}`);
  },
});

cli.runApp(
  new ServerOptions({ agent: fileURLToPath(import.meta.url), agentName: 'story-time-agent' }),
);
