/**
 * Onboarding Function
 * Simple LLM call (not an agent) that processes parent onboarding transcript
 * and generates a structured markdown with parent persona and child profile
 */

import { inference } from "@livekit/agents";
import type { StoryContext, ParentPersona, ChildProfile } from "../types.js";

const ONBOARDING_SYSTEM_PROMPT = `You are an expert at understanding parents and creating detailed profiles for a storytelling AI.

Your job is to analyze a transcript from a parent onboarding conversation and extract:
1. Parent Persona - How they tell stories, their style, values, favorite themes
2. Child Profile - The child's name, age, interests, attention span, preferences

Be thorough but also infer reasonable defaults when information is missing. Parents don't always say everything explicitly.

Output your analysis as a structured JSON object followed by a markdown summary.

The JSON should have this exact structure:
{
  "parentPersona": {
    "name": "string",
    "storytellingStyle": "string describing how they like to tell stories",
    "voiceTone": "string describing their voice/tone",
    "favoriteThemes": ["array", "of", "themes"],
    "culturalBackground": "optional string",
    "specialPhrases": ["optional", "phrases", "they", "use"],
    "values": ["array", "of", "values"],
    "avoidTopics": ["optional", "topics", "to", "avoid"]
  },
  "childProfile": {
    "name": "string",
    "age": number,
    "interests": ["array", "of", "interests"],
    "fears": ["optional", "fears"],
    "favoriteCharacters": ["optional", "characters"],
    "attentionSpan": "short" | "medium" | "long",
    "preferredStoryLength": "quick" | "medium" | "bedtime"
  }
}

After the JSON, provide a warm, narrative markdown summary that captures the essence of this family's storytime moments. This markdown will be used to give context to the storytelling AI.`;

/**
 * Process parent onboarding transcript and extract persona/profile
 * This is a simple LLM call, not an agent
 */
export async function processOnboarding(transcript: string): Promise<StoryContext> {
  const llmInstance = new inference.LLM({
    model: "openai/gpt-4o-mini",
    modelOptions: {
      temperature: 0.3,
    },
  });

  const prompt = `${ONBOARDING_SYSTEM_PROMPT}\n\nPlease analyze this parent onboarding transcript and create a persona profile:\n\n${transcript}`;

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

  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*?"parentPersona"[\s\S]*?"childProfile"[\s\S]*?\}\s*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to extract persona JSON from response");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    parentPersona: ParentPersona;
    childProfile: ChildProfile;
  };

  // Extract markdown (everything after the JSON)
  const markdownStart = content.indexOf(jsonMatch[0]) + jsonMatch[0].length;
  let rawMarkdown = content.slice(markdownStart).trim();

  // If no markdown after JSON, generate a basic one
  if (!rawMarkdown || rawMarkdown.length < 50) {
    rawMarkdown = generateMarkdownSummary(parsed.parentPersona, parsed.childProfile);
  }

  return {
    parentPersona: parsed.parentPersona,
    childProfile: parsed.childProfile,
    rawMarkdown,
  };
}

function generateMarkdownSummary(parent: ParentPersona, child: ChildProfile): string {
  return `# Storytime Profile: ${child.name}'s Family

## About ${parent.name} (Parent)
${parent.name} has a **${parent.storytellingStyle}** storytelling style with a **${parent.voiceTone}** tone.

### Values They Want to Share
${parent.values.map(v => `- ${v}`).join("\n")}

### Favorite Story Themes
${parent.favoriteThemes.map(t => `- ${t}`).join("\n")}

${parent.specialPhrases?.length ? `### Special Phrases They Love\n${parent.specialPhrases.map(p => `- "${p}"`).join("\n")}` : ""}

${parent.avoidTopics?.length ? `### Topics to Avoid\n${parent.avoidTopics.map(t => `- ${t}`).join("\n")}` : ""}

## About ${child.name} (Child)
**Age:** ${child.age} years old
**Attention Span:** ${child.attentionSpan}
**Preferred Story Length:** ${child.preferredStoryLength}

### Interests
${child.interests.map(i => `- ${i}`).join("\n")}

${child.favoriteCharacters?.length ? `### Favorite Characters\n${child.favoriteCharacters.map(c => `- ${c}`).join("\n")}` : ""}

${child.fears?.length ? `### Sensitive Topics (handle with care)\n${child.fears.map(f => `- ${f}`).join("\n")}` : ""}

---
*This profile helps the storytelling AI tell stories just the way ${parent.name} would.*`;
}
