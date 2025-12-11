import type { JobContext } from '@livekit/agents';
import { inference, metrics, voice } from '@livekit/agents';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import { cleanupSession, getStorytellingTools } from '../tools/storytelling-tools.js';
import { RoomEventHandler } from './room-event-handler.js';
import { SessionRegistry } from './session-registry.js';

export interface SessionContext {
  session: voice.AgentSession;
  agent: voice.Agent;
  ctx: JobContext;
}

const DEFAULT_VOICE_ID = 'Xb7hH8MSUJpSbSDYk0k2';

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
  private voiceId: string;

  constructor(ctx: JobContext, sessionRegistry: SessionRegistry) {
    this.ctx = ctx;
    this.sessionRegistry = sessionRegistry;
    this.roomName = ctx.job.room?.name ?? 'unknown';

    this.voiceId = this.extractVoiceIdFromMetadata();

    const [onboardingTool, createStoryTool, tellStoryTool] = getStorytellingTools();

    this.agent = new voice.Agent({
      instructions: `You are the Story Time assistant, a warm and magical voice AI that creates personalized bedtime stories for children.

CORE CAPABILITIES:
1. Learn about families - Ask the parent about themselves and their child (names, ages, interests, storytelling style, values)
2. Create custom stories - When a child requests a story, create a magical tale tailored to the family
3. Tell engaging stories - Narrate stories page by page with warmth and emotion

YOUR WORKFLOW:
Step 1 - ONBOARDING (First interaction):
  - Warmly greet the family
  - Ask the parent about themselves: name, storytelling style, favorite themes, values
  - Ask about their child: name, age, interests, fears to avoid, attention span
  - Use the create_story_context tool to save this information

Step 2 - STORY REQUEST (When child asks for a story):
  - Listen to what kind of story they want (topic, character, theme)
  - Use the create_story_synopsis tool to design the perfect story
  - Briefly preview the story title and what it's about

Step 3 - STORYTELLING (Telling the story):
  - Use the tell_story tool to get each page
  - Narrate the story content naturally with emotion and pacing
  - Follow any interaction prompts or suggested pauses
  - Continue page by page until the story is complete

VOICE & STYLE:
- Speak naturally and warmly, as a loving storyteller would
- Match the parent's storytelling style (learned during onboarding)
- Use appropriate pacing, pauses, and vocal variety
- Keep responses conversational and without complex formatting
- When telling stories, speak the story content directly - don't say "here's the story" just tell it

IMPORTANT:
- The user is interacting via voice, not text
- Be concise when not storytelling
- When storytelling, be expressive and engaging
- Always use the tools to generate story content - never make up stories yourself`,
      tools: {
        create_story_context: onboardingTool,
        create_story_synopsis: createStoryTool,
        tell_story: tellStoryTool,
      },
    });
  }

  private extractVoiceIdFromMetadata(): string {
    try {
      const metadata = this.ctx.job.metadata;
      if (metadata) {
        const parsedMetadata = JSON.parse(metadata);
        const voiceId = parsedMetadata.voice_id;
        if (voiceId && typeof voiceId === 'string') {
          console.log(`Using voice ID from metadata: ${voiceId}`);
          return voiceId;
        }
      }
    } catch (error) {
      console.warn('Failed to parse job metadata for voice ID:', error);
    }

    console.log(`Using default voice ID: ${DEFAULT_VOICE_ID}`);
    return DEFAULT_VOICE_ID;
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
    this.session.say(`## Page 1

Once upon a time, in a cozy little town where the sun always smiled and the flowers danced in the breeze, there lived a curious little girl named Dudu. Dudu had big, sparkling eyes that twinkled like the stars and a giggle that could make even the grumpiest cat crack a smile. Every day after breakfast, she would put on her favorite rainbow-colored shoes and set off to explore the wonders of her backyard.

One sunny morning, as Dudu was playing among the daisies, she noticed something shiny peeking out from behind a big, twisty tree. “What’s that?” she wondered aloud, her voice filled with excitement. With a hop, skip, and a jump, she hurried over to investigate. When she reached the tree, she knelt down and, with a little wiggle of her fingers, she pulled out a tiny, glittering key. "Oh my fluffy socks! What could this open?" she exclaimed in a silly voice that made her giggle even more. Little did she know, this key was the start of a magical adventure!

## Page 2

Dudu held the tiny key up high, letting the sunlight dance on its sparkly surface. “I bet it opens something super-duper special!” she squealed, her eyes as wide as saucers. She skipped around the garden, searching high and low, behind bushes and under rocks, her heart racing with excitement. Suddenly, she heard a soft, whispering sound. “Psst! Down here!” It was a tiny, fluffy bunny with the fluffiest tail Dudu had ever seen. “I’m Benny the Bunny, and I know exactly what that key unlocks!” 

Benny hopped closer, his little nose twitching. “Follow me, and let’s go on a magical adventure!” Dudu felt a warm flutter in her tummy as she followed Benny down a hidden path she had never noticed before. They arrived at a sparkling door nestled in the roots of an old oak tree, its colors swirling like a rainbow. Dudu’s heart danced with joy. “This must be it!” she said, her voice bubbling like fizzy soda. With a deep breath and a giggle, she inserted the key into the lock. “Here goes nothing!” she cheered, turning the key with a clink that echoed like a tiny bell. And just like that, the door swung open, revealing a world full of shimmering lights and giggling fairies!

## Page 3

Page 3:  
Dudu's eyes grew even wider as she stepped through the sparkling door, and Benny hopped in right beside her. They found themselves in a magical meadow filled with flowers that sang sweet melodies and butterflies that painted the sky with their colorful wings. “Whoa! This is amazing!” Dudu squealed, doing a little twirl that made the flowers giggle along with her.  

Suddenly, a tiny fairy with shimmering wings fluttered down, her voice like the tinkling of little bells. “Welcome, Dudu! I’m Tilly the Fairy, and we’ve been waiting for you!” Tilly waved her wand, and a sparkling trail of dust floated through the air, leading to a big, glittery slide made of rainbows. “Are you ready for a super-duper fun ride?” she asked with a wink. Dudu clapped her hands in delight. “Oh yes, yes, yes!” she cheered, feeling a tickle of excitement in her tummy. Together with Benny and Tilly, Dudu climbed up the slide, ready to zoom down into more magical adventures!

## Page 4

As Dudu reached the top of the glittery slide, she took a deep breath and shouted, “Wheeeeee!” down she went, spinning and swirling through a rainbow tunnel that sparkled like a million stars! Benny hopped beside her, his fluffy tail bouncing with excitement. “Hold on tight, Dudu!” he giggled, his little voice full of joy. At the end of the slide, they landed softly on a fluffy cloud that giggled just like Dudu. “That was so fun!” she squealed, jumping up and down on the cloud.

Suddenly, Tilly appeared, her wings sparkling like tiny rainbows. “Now it's time for the best part!” she announced, waving her wand again. With a twirl, a group of friendly animals appeared—a dancing squirrel, a singing bird, and even a playful little fox. “We’re having a magical treasure hunt!” said the squirrel, bouncing around with glee. “Follow us, and let’s find the hidden treasure!” Dudu’s eyes sparkled with excitement as she raced after her new friends, ready to discover more magical surprises in this enchanting world. “Let’s go, go, go!” she shouted, laughter bubbling up as she joined in on the adventure!

## Page 5

Page 5:  
Dudu and her new friends scurried through the magical meadow, following the twinkling trail of sparkling dust that Tilly had left behind. They hopped over lilypads that giggled and whispered secrets, ducked under branches that swayed and danced, and followed the singing bird, who chirped clues that led them closer and closer to the treasure. “Look! Over there!” Dudu pointed, her heart racing with excitement as they reached a shimmering chest hidden beneath a rainbow-colored bush.  

With a little flick of her wrist, Tilly opened the chest, revealing a dazzling assortment of sparkling jewels, twinkling stars, and the most beautiful, fluffy clouds you could ever imagine! “This is a treasure of joy and friendship!” Tilly exclaimed, her eyes shining bright. Dudu hugged Benny and her new friends, filled with warmth and happiness. “Thank you for this magical adventure!” she said with a beaming smile. As the sun began to set, painting the sky in gentle shades of pink and gold, Dudu knew it was time to return home. With a wave and a giggle, they all promised to meet again. Dudu stepped back through the sparkling door, her heart full of laughter, ready for sweet dreams and more adventures to come. Goodnight, little explorer! 🌙✨`);
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
   * Update the voice ID and recreate the TTS
   * Note: This will take effect on the next TTS generation
   */
  async updateVoiceId(newVoiceId: string): Promise<void> {
    console.log(`Updating voice ID from ${this.voiceId} to ${newVoiceId}`);
    this.voiceId = 'YEPxsTk32dk1sVTotPBJ';

    // Create new TTS instance with updated voice
    const newTts = new elevenlabs.TTS({
      modelID: process.env.MODEL_ID!,
      voice: { id: 'YEPxsTk32dk1sVTotPBJ', name: 'Mike', category: 'premium' },
      apiKey: 'sk_1ccaaa5fdebadda255af4c41d8802042458231ab4155bac9',
    });

    // Update the session's TTS
    // Note: This will take effect on the next speech generation
    this.session.tts = newTts;

    console.log(`Voice updated successfully to ${newVoiceId}`);
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

      // Text-to-speech (TTS) - ElevenLabs
      tts: new inference.TTS({
        model: 'elevenlabs/eleven_turbo_v2_5',
        voice: this.voiceId,
        language: 'en',
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
      cleanupSession(this.roomName);
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
    this.eventHandler = new RoomEventHandler(
      {
        session: this.session,
        agent: this.agent,
        ctx: this.ctx,
        roomName: this.roomName,
        room: this.ctx.room,
      },
      this.sessionRegistry,
    );
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
