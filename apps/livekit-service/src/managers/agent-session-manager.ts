import type { JobContext } from '@livekit/agents';
import { inference, metrics, voice } from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { RoomEventHandler } from './room-event-handler.js';
import { SessionRegistry } from './session-registry.js';

/**
 * Context for the agent session
 */
export interface SessionContext {
  session: voice.AgentSession;
  agent: voice.Agent;
  ctx: JobContext;
}

/**
 * Manages the lifecycle of an agent session
 */
export class AgentSessionManager {
  private ctx: JobContext;
  private roomName: string;
  private session!: voice.AgentSession;
  private agent!: voice.Agent;
  private usageCollector!: metrics.UsageCollector;
  private eventHandler!: RoomEventHandler;
  private sessionRegistry: SessionRegistry;

  constructor(ctx: JobContext, sessionRegistry: SessionRegistry) {
    this.ctx = ctx;
    this.sessionRegistry = sessionRegistry;
    this.roomName = ctx.job.room?.name ?? 'unknown';
    this.agent = new voice.Agent({
      instructions: `You are the Story Time assistant, a helpful voice AI that helps users manage and play stories.
      The user is interacting with you via voice, even if you perceive the conversation as text.
      You can help users by listening to their requests and responding naturally.
      Your responses are concise, to the point, and without any complex formatting or punctuation including emojis, asterisks, or other symbols.
      You are curious, friendly, and have a sense of humor.

      Note: The frontend can also send direct action commands to store, retrieve, and play stories through data messages.`,
    });
  }

  /**
   * Initialize the agent session
   */
  async initialize(): Promise<void> {
    await this.initializeRoom();
    this.setupMetricsCollection();
    this.setupShutdownCallbacks();
    await this.startSession();
    this.registerSession();
    this.subscribeToEvents();
  }

  /**
   * Get the session context
   */
  getContext(): SessionContext {
    return {
      session: this.session,
      agent: this.agent,
      ctx: this.ctx,
    };
  }

  /**
   * Create the voice pipeline
   */
  private async createVoicePipeline(): Promise<voice.AgentSession> {
    const session = new voice.AgentSession({
      // Speech-to-text (STT)
      stt: new inference.STT({
        model: 'assemblyai/universal-streaming',
        language: 'en',
      }),

      // Large Language Model (LLM)
      llm: new inference.LLM({
        model: 'openai/gpt-4.1-mini',
      }),

      // Text-to-speech (TTS)
      tts: new inference.TTS({
        model: 'cartesia/sonic-3',
        voice: '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
      }),

      // Turn detection
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad: this.ctx.proc.userData.vad! as silero.VAD,
      voiceOptions: {
        preemptiveGeneration: true,
      },
    });

    return session;
  }

  /**
   * Set up metrics collection
   */
  private setupMetricsCollection(): void {
    this.usageCollector = new metrics.UsageCollector();

    this.session.on(voice.AgentSessionEventTypes.MetricsCollected, (ev) => {
      metrics.logMetrics(ev.metrics);
      this.usageCollector.collect(ev.metrics);
    });
  }

  /**
   * Set up shutdown callbacks
   */
  private setupShutdownCallbacks(): void {
    this.ctx.addShutdownCallback(async () => {
      console.log(`Shutting down agent for room: ${this.roomName}`);
      this.eventHandler?.unsubscribeFromEvents();
      await this.logUsage();
      this.sessionRegistry.unregister(this.roomName);
    });
  }

  /**
   * Start the agent session
   */
  private async startSession(): Promise<void> {
    await this.session.start({
      agent: this.agent,
      room: this.ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });
  }

  /**
   * Register the session in the registry
   */
  private registerSession(): void {
    this.sessionRegistry.register(this.roomName, {
      session: this.session,
      agent: this.agent,
      ctx: this.ctx,
    });
  }

  /**
   * Initialize room connection
   */
  private async initializeRoom(): Promise<void> {
    await this.ctx.connect();
    this.session = await this.initParticipantSession();
  }

  /**
   * Initialize session after participant connects
   */
  private async initParticipantSession(): Promise<voice.AgentSession> {
    await this.ctx.waitForParticipant();
    return await this.createVoicePipeline();
  }

  /**
   * Subscribe to room events
   */
  private subscribeToEvents(): void {
    this.eventHandler = new RoomEventHandler({
      session: this.session,
      agent: this.agent,
      ctx: this.ctx,
      roomName: this.roomName,
      room: this.ctx.room,
    });
    this.eventHandler.subscribeToEvents();
  }

  /**
   * Log usage metrics
   */
  private async logUsage(): Promise<void> {
    const summary = this.usageCollector.getSummary();
    console.log(`Usage for room ${this.roomName}: ${JSON.stringify(summary)}`);
  }
}
