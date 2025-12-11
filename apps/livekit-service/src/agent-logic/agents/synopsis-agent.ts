/**
 * Synopsis Agent
 * Uses LiveKit inference LLM to create story synopses
 * Resilient to vague requests - always creates something magical
 */

import { inference } from "@livekit/agents";
import type { StorySynopsis, StoryContext } from "../types.js";

function getStoryLengthConfig(length: "quick" | "medium" | "bedtime"): { pages: number; description: string } {
  switch (length) {
    case "quick": return { pages: 3, description: "3 short pages" };
    case "medium": return { pages: 5, description: "5 medium pages" };
    case "bedtime": return { pages: 8, description: "8 cozy pages" };
  }
}

function buildSynopsisPrompt(context: StoryContext, childRequest: string): string {
  const { parentPersona, childProfile, rawMarkdown } = context;
  const lengthConfig = getStoryLengthConfig(childProfile.preferredStoryLength);

  return `You are a master storyteller creating story synopses for children.
You are the digital twin of the parent, telling stories in their style and voice.

CRITICAL CONTEXT:
- Storytime is a precious bonding moment between parent and child
- Even if the child's request is vague ("tell me a story", "I dunno", "something fun"), CREATE something wonderful
- Use the parent's favorite themes and the child's interests to fill in gaps
- NEVER refuse or ask for clarification - just create magic

PARENT PERSONA:
${JSON.stringify(parentPersona, null, 2)}

CHILD PROFILE:
${JSON.stringify(childProfile, null, 2)}

ADDITIONAL CONTEXT:
${rawMarkdown}

When creating a synopsis:
1. Match the parent's storytelling style and voice tone
2. Include themes the parent loves: ${parentPersona.favoriteThemes.join(", ")}
3. Feature characters/settings the child enjoys: ${childProfile.interests.join(", ")}
4. Keep age-appropriate (child is ${childProfile.age} years old)
5. Plan for ${lengthConfig.description} (${lengthConfig.pages} pages)
6. Include a gentle moral aligned with parent's values: ${parentPersona.values.join(", ")}

CHILD'S REQUEST: "${childRequest}"

You MUST respond with ONLY a valid JSON object in this exact format (no markdown, no code blocks, just the JSON):
{
  "title": "string",
  "premise": "string",
  "mainCharacters": [
    {
      "name": "string",
      "description": "string",
      "role": "protagonist" | "sidekick" | "mentor" | "antagonist" | "supporting"
    }
  ],
  "setting": "string",
  "theme": "string",
  "moralLesson": "string",
  "estimatedPages": ${lengthConfig.pages},
  "outline": ["beat 1", "beat 2", "..."]
}`;
}

/**
 * Create a story synopsis using the synopsis agent
 */
export async function createStorySynopsis(
  context: StoryContext,
  childRequest: string
): Promise<StorySynopsis> {
  const llmInstance = new inference.LLM({
    model: "openai/gpt-4o-mini",
    modelOptions: {
      temperature: 0.7,
    },
  });

  const prompt = buildSynopsisPrompt(context, childRequest);

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

  // Try to parse synopsis from response
  try {
    // Remove markdown code blocks if present
    let cleanContent = content.trim();
    cleanContent = cleanContent.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');

    // Look for JSON object
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as StorySynopsis;
      return parsed;
    }
  } catch (error) {
    console.warn('Failed to parse synopsis from LLM response:', error);
  }

  // Fallback synopsis if parsing fails
  return createFallbackSynopsis(context, childRequest);
}

function createFallbackSynopsis(context: StoryContext, request: string): StorySynopsis {
  const { childProfile, parentPersona } = context;
  const lengthConfig = getStoryLengthConfig(childProfile.preferredStoryLength);

  return {
    title: `${childProfile.name}'s Magical Adventure`,
    premise: `${childProfile.name} discovers something wonderful that leads to an adventure filled with ${parentPersona.favoriteThemes[0] || "friendship"} and ${parentPersona.favoriteThemes[1] || "courage"}.`,
    mainCharacters: [
      {
        name: childProfile.name,
        description: `A curious ${childProfile.age}-year-old who loves ${childProfile.interests[0] || "adventures"}`,
        role: "protagonist" as const,
      },
      {
        name: "Friendly Guide",
        description: "A helpful companion who appears when needed",
        role: "sidekick" as const,
      },
    ],
    setting: "A magical world just beyond the everyday",
    theme: parentPersona.favoriteThemes[0] || "friendship",
    moralLesson: parentPersona.values[0] || "Being kind always matters",
    estimatedPages: lengthConfig.pages,
    outline: [
      "The ordinary day turns extraordinary",
      "A challenge appears that needs solving",
      "Help comes from an unexpected place",
      "The lesson is learned through experience",
      "Home sweet home, wiser than before",
    ].slice(0, lengthConfig.pages),
  };
}
