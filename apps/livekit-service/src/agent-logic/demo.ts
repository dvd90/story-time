/**
 * Demo script - generates a story based on parent context markdown
 * Child asks for a story -> agent generates and streams chunks
 */

import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createStorySynopsis } from "./agents/synopsis-agent.js";
import { streamStory } from "./agents/storytelling-agent.js";
import type { StoryContext, StoryPage } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load the parent context markdown
const parentContextMd = readFileSync(join(__dirname, "parent-context.md"), "utf-8");

// Pre-parsed context from the markdown
const context: StoryContext = {
  parentPersona: {
    name: "Mike",
    storytellingStyle: "chill and relaxed with occasional silly voices",
    voiceTone: "casual and warm",
    favoriteThemes: ["adventure", "discovery"],
    values: ["curiosity", "fun"],
    avoidTopics: ["scary content", "monsters"],
  },
  childProfile: {
    name: "Dudu",
    age: 3,
    interests: ["dinosaurs", "T-Rex", "trucks", "construction", "space", "rockets"],
    fears: ["scary things", "monsters"],
    attentionSpan: "short",
    preferredStoryLength: "quick",
  },
  rawMarkdown: parentContextMd,
};

/**
 * Generate a story from a child's request
 * Yields story pages as chunks for streaming
 */
export async function* generateStory(childRequest: string): AsyncGenerator<StoryPage> {
  // Create synopsis
  const synopsis = await createStorySynopsis(context, childRequest);

  // Stream pages as they're generated
  yield* streamStory(synopsis, context);
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}`) {
  const childRequest = process.argv[2] || "I want a story about dinosaurs!";

  async function main() {
    console.log(`\nGenerating story for: "${childRequest}"\n`);

    let storyContent = "";

    for await (const page of generateStory(childRequest)) {
      console.log(`--- Page ${page.pageNumber} ---`);
      console.log(page.content);
      console.log();

      storyContent += `## Page ${page.pageNumber}\n\n${page.content}\n\n`;
    }

    const filename = `story-${Date.now()}.md`;
    writeFileSync(filename, storyContent);
    console.log(`Story saved to: ${filename}`);
  }

  main().catch(console.error);
}
