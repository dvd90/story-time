/**
 * Storytelling Agent
 * Uses LiveKit inference LLM to generate story pages
 * Streams pages one at a time, maintaining continuity
 */

import { inference } from "@livekit/agents";
import type { StoryPage, StorySynopsis, StoryContext, StoryState } from "../types.js";

function getPageGuidance(pageNum: number, totalPages: number): string {
  if (pageNum === 1) {
    return "This is the OPENING page. Set the scene, introduce the main character, and hook the listener with wonder.";
  }
  if (pageNum === totalPages) {
    return "This is the FINAL page. Bring the story to a warm, satisfying close. End with comfort and peace - perfect for drifting off to sleep.";
  }
  if (pageNum === Math.ceil(totalPages / 2)) {
    return "This is the MIDDLE of the story. The challenge or adventure should be at its peak!";
  }
  return "Continue the story with good pacing. Build toward the resolution.";
}

function buildStorytellingPrompt(
  synopsis: StorySynopsis,
  context: StoryContext,
  previousPages: StoryPage[],
  currentPageNum: number
): string {
  const { parentPersona, childProfile } = context;
  const totalPages = synopsis.estimatedPages;

  const previousPagesContext = previousPages.length > 0
    ? `Previous pages:\n${previousPages.map((p, i) =>
        `Page ${i + 1}: ${p.content.substring(0, 150)}...`
      ).join("\n")}`
    : "This is the first page.";

  return `You are telling a bedtime story as the digital twin of a loving parent.
Your voice, style, and warmth should match the parent's persona exactly.

PARENT VOICE:
- Style: ${parentPersona.storytellingStyle}
- Tone: ${parentPersona.voiceTone}
- Special phrases to use: ${parentPersona.specialPhrases?.join(", ") || "none specified"}
- Values to weave in: ${parentPersona.values.join(", ")}

CHILD:
- Name: ${childProfile.name}
- Age: ${childProfile.age}
- Interests: ${childProfile.interests.join(", ")}

STORY SYNOPSIS:
Title: ${synopsis.title}
Premise: ${synopsis.premise}
Setting: ${synopsis.setting}
Theme: ${synopsis.theme}
Moral: ${synopsis.moralLesson}

Story outline:
${synopsis.outline.map((o, i) => `${i + 1}. ${o}`).join("\n")}

CURRENT PROGRESS:
Page ${currentPageNum} of ${totalPages}
${previousPagesContext}

YOUR TASK:
Write page ${currentPageNum} of the story. This should be:
- 2-4 paragraphs, perfect for reading aloud
- Age-appropriate vocabulary for a ${childProfile.age}-year-old
- Engaging with sensory details and emotion
- Following the outline beat for this page
- Maintaining continuity with previous pages

${getPageGuidance(currentPageNum, totalPages)}

You MUST respond with ONLY a valid JSON object in this exact format (no markdown, no code blocks):
{
  "content": "The story text for this page (2-4 paragraphs)",
  "suggestedPause": true/false (optional),
  "interactionPrompt": "Optional prompt for child engagement" (optional)
}

Make it magical. This is storytime.`;
}

/**
 * Generate the next page of the story
 */
export async function generateNextPage(
  synopsis: StorySynopsis,
  context: StoryContext,
  previousPages: StoryPage[]
): Promise<{ page: StoryPage; isLastPage: boolean }> {
  const currentPageNum = previousPages.length + 1;
  const totalPages = synopsis.estimatedPages;
  const isLastPage = currentPageNum >= totalPages;

  const llmInstance = new inference.LLM({
    model: "openai/gpt-4o-mini",
    modelOptions: {
      temperature: 0.8,
    },
  });

  const prompt = buildStorytellingPrompt(synopsis, context, previousPages, currentPageNum);

  // Import llm module for ChatContext
  const { llm } = await import("@livekit/agents");
  const chatCtx = llm.ChatContext.empty();
  chatCtx.addMessage({
    role: "user",
    content: prompt,
  });

  const stream = llmInstance.chat({ chatCtx });

  let content = "";
  for await (const chunk of stream) {
    if (chunk.delta?.content) {
      content += chunk.delta.content;
    }
  }

  let pageData: { content: string; suggestedPause?: boolean; interactionPrompt?: string };

  try {
    // Remove markdown code blocks if present
    let cleanContent = content.trim();
    cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      pageData = JSON.parse(jsonMatch[0]);
    } else {
      pageData = { content: cleanContent };
    }
  } catch {
    pageData = { content: content.trim() };
  }

  const page: StoryPage = {
    pageNumber: currentPageNum,
    content: pageData.content,
    ...(pageData.suggestedPause !== undefined && { suggestedPause: pageData.suggestedPause }),
    ...(pageData.interactionPrompt !== undefined && { interactionPrompt: pageData.interactionPrompt }),
  };

  return { page, isLastPage };
}

/**
 * Stream all pages of a story, yielding each page as it's generated
 */
export async function* streamStory(
  synopsis: StorySynopsis,
  context: StoryContext
): AsyncGenerator<StoryPage, void, unknown> {
  const pages: StoryPage[] = [];

  while (pages.length < synopsis.estimatedPages) {
    const { page, isLastPage } = await generateNextPage(synopsis, context, pages);
    pages.push(page);
    yield page;
    if (isLastPage) break;
  }
}

/**
 * Generate the complete story (non-streaming)
 */
export async function generateFullStory(
  synopsis: StorySynopsis,
  context: StoryContext
): Promise<StoryState> {
  const pages: StoryPage[] = [];

  for await (const page of streamStory(synopsis, context)) {
    pages.push(page);
  }

  return {
    synopsis,
    context,
    pages,
    currentPage: pages.length,
    isComplete: true,
  };
}
