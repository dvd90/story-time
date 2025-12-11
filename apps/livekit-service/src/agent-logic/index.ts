/**
 * Storytime Agent - Main Entry Point
 *
 * A digital twin of a parent for reading children's stories.
 * Uses LangChain v1 with OpenAI:
 * 1. Onboarding Function - Simple LLM call to create parent/child markdown
 * 2. Synopsis Agent - createAgent to generate story synopsis
 * 3. Storytelling Agent - createAgent to generate story pages
 */

import "dotenv/config";

// Export types
export type {
  ParentPersona,
  ChildProfile,
  StoryContext,
  StorySynopsis,
  StoryPage,
  StoryState,
} from "./types.js";

// Export functions
export { processOnboarding } from "./agents/onboarding.js";
export { createStorySynopsis } from "./agents/synopsis-agent.js";
export { generateNextPage, streamStory, generateFullStory } from "./agents/storytelling-agent.js";

// Convenience orchestrator
import { processOnboarding } from "./agents/onboarding.js";
import { createStorySynopsis } from "./agents/synopsis-agent.js";
import { streamStory, generateFullStory } from "./agents/storytelling-agent.js";
import type { StoryContext, StorySynopsis, StoryPage, StoryState } from "./types.js";

export class StorytimeOrchestrator {
  private context: StoryContext | null = null;

  /**
   * Step 1: Process parent onboarding transcript
   * Simple LLM call - creates parent persona and child profile markdown
   */
  async onboardParent(transcript: string): Promise<StoryContext> {
    this.context = await processOnboarding(transcript);
    return this.context;
  }

  /**
   * Set context directly if already processed
   */
  setContext(context: StoryContext): void {
    this.context = context;
  }

  /**
   * Get current context
   */
  getContext(): StoryContext | null {
    return this.context;
  }

  /**
   * Step 2: Create a story synopsis from child's request
   * Uses createAgent with tools
   */
  async createSynopsis(childRequest: string): Promise<StorySynopsis> {
    if (!this.context) {
      throw new Error("Context not set. Call onboardParent() first.");
    }
    return createStorySynopsis(this.context, childRequest);
  }

  /**
   * Step 3: Stream story pages
   * Uses createAgent - yields each page as it's generated
   */
  async *tellStory(synopsis: StorySynopsis): AsyncGenerator<StoryPage, void, unknown> {
    if (!this.context) {
      throw new Error("Context not set. Call onboardParent() first.");
    }
    yield* streamStory(synopsis, this.context);
  }

  /**
   * Get the full story without streaming
   */
  async getFullStory(synopsis: StorySynopsis): Promise<StoryState> {
    if (!this.context) {
      throw new Error("Context not set. Call onboardParent() first.");
    }
    return generateFullStory(synopsis, this.context);
  }
}
