/**
 * Storytelling Tools
 * Function tools that the LiveKit agent can call to generate and tell stories
 */

import { llm, getJobContext } from '@livekit/agents';
import { z } from 'zod';
import { processOnboarding } from '../agent-logic/agents/onboarding.js';
import { createStorySynopsis } from '../agent-logic/agents/synopsis-agent.js';
import { streamStory } from '../agent-logic/agents/storytelling-agent.js';
import type { StoryContext, StorySynopsis, StoryPage } from '../agent-logic/types.js';

// Store story context per session (in production, use a database)
const sessionContexts = new Map<string, StoryContext>();
const sessionStories = new Map<string, { synopsis: StorySynopsis; pages: StoryPage[] }>();

/**
 * Tool to process onboarding and create parent/child context
 */
export const onboardingTool = llm.tool({
  description:
    'Process information about the parent and child to create a storytelling context. Call this when you learn about the parent and child (their names, ages, interests, storytelling style, etc.).',
  parameters: z.object({
    parentInfo: z
      .string()
      .describe('Information about the parent: name, storytelling style, favorite themes, values, etc.'),
    childInfo: z
      .string()
      .describe('Information about the child: name, age, interests, fears, attention span, etc.'),
  }),
  execute: async ({ parentInfo, childInfo }) => {
    try {
      const transcript = `Parent Information:\n${parentInfo}\n\nChild Information:\n${childInfo}`;
      const context = await processOnboarding(transcript);

      // Store context for this session (use room name as session ID)
      const ctx = getJobContext();
      const sessionId = ctx.job.room?.name ?? 'default';
      sessionContexts.set(sessionId, context);

      return JSON.stringify({
        success: true,
        message: `Got it! I've learned about ${context.parentPersona.name} and ${context.childProfile.name}. Ready to create magical stories!`,
        context: {
          parent: context.parentPersona.name,
          child: context.childProfile.name,
          age: context.childProfile.age,
        },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process context',
      });
    }
  },
});

/**
 * Tool to create a story synopsis based on child's request
 */
export const createStoryTool = llm.tool({
  description:
    "Create a story synopsis based on what the child wants. Call this when the child requests a story or says what kind of story they'd like to hear.",
  parameters: z.object({
    childRequest: z
      .string()
      .describe(
        'What the child said about the story they want (e.g., "a story about dinosaurs", "something about space", "I want an adventure")',
      ),
  }),
  execute: async ({ childRequest }) => {
    try {
      const ctx = getJobContext();
      const sessionId = ctx.job.room?.name ?? 'default';
      const context = sessionContexts.get(sessionId);

      if (!context) {
        return JSON.stringify({
          success: false,
          error:
            'No story context found. Please set up the parent and child information first using create_story_context.',
        });
      }

      const synopsis = await createStorySynopsis(context, childRequest);

      // Store synopsis for this session
      sessionStories.set(sessionId, { synopsis, pages: [] });

      return JSON.stringify({
        success: true,
        message: `I've created a story called "${synopsis.title}". It's about ${synopsis.premise}`,
        synopsis: {
          title: synopsis.title,
          premise: synopsis.premise,
          theme: synopsis.theme,
          pages: synopsis.estimatedPages,
        },
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create story synopsis',
      });
    }
  },
});

/**
 * Tool to start telling the story page by page
 */
export const tellStoryTool = llm.tool({
  description:
    'Start telling the story that was just created. This will return the first page of the story. Call this after creating a synopsis when ready to begin storytelling.',
  parameters: z.object({}),
  execute: async (_params) => {
    try {
      const ctx = getJobContext();
      const sessionId = ctx.job.room?.name ?? 'default';
      const context = sessionContexts.get(sessionId);
      const storyData = sessionStories.get(sessionId);

      if (!context || !storyData) {
        return JSON.stringify({
          success: false,
          error: 'No story found. Please create a story synopsis first.',
        });
      }

      const { synopsis } = storyData;

      // Get the first page
      const storyGenerator = streamStory(synopsis, context);
      const firstPageResult = await storyGenerator.next();

      if (firstPageResult.done || !firstPageResult.value) {
        return JSON.stringify({
          success: false,
          error: 'Failed to generate story page',
        });
      }

      const firstPage = firstPageResult.value;
      storyData.pages.push(firstPage);

      return JSON.stringify({
        success: true,
        page: firstPage.pageNumber,
        content: firstPage.content,
        totalPages: synopsis.estimatedPages,
        interactionPrompt: firstPage.interactionPrompt,
        suggestedPause: firstPage.suggestedPause,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to tell story',
      });
    }
  },
});

/**
 * Get all storytelling tools
 */
export function getStorytellingTools() {
  return [onboardingTool, createStoryTool, tellStoryTool] as const;
}

/**
 * Clean up session data when room closes
 */
export function cleanupSession(sessionId: string) {
  sessionContexts.delete(sessionId);
  sessionStories.delete(sessionId);
}
