/**
 * Example usage of the Storytime Agent system
 *
 * Run with:
 *   pnpm dev
 *
 * Requires OPENAI_API_KEY in .env
 */

import { writeFileSync } from "fs";
import { StorytimeOrchestrator } from "./index";

// Example parent onboarding transcript
const EXAMPLE_TRANSCRIPT = `
Hey, so I'm Mike, I'm Dudu's dad. He just turned 3 last month.

Leo's super into dinosaurs right now, and T-Rex is his favorite, obviously. He also
loves trucks.. construction stuff, and lately he's been really into space and rockets.

When I read to him I keep it pretty chill, nothing too over the top., but I do silly voices sometimes
when he's into it.

Some Things to avoid - nothing too scary, no monsters or anything like.

Thanks
`;

async function main() {
  console.log("Storytime Agent Demo\n");
  console.log("=".repeat(50));
  console.log("\nUsing OpenAI (gpt-4o-mini)\n");

  // Initialize the orchestrator
  const storytime = new StorytimeOrchestrator();

  // Step 1: Process parent onboarding
  console.log("\nStep 1: Processing parent onboarding...\n");
  const context = await storytime.onboardParent(EXAMPLE_TRANSCRIPT);

  console.log("Parent Persona:");
  console.log(`  Name: ${context.parentPersona.name}`);
  console.log(`  Style: ${context.parentPersona.storytellingStyle}`);
  console.log(`  Tone: ${context.parentPersona.voiceTone}`);
  console.log(`  Themes: ${context.parentPersona.favoriteThemes.join(", ")}`);

  console.log("\nChild Profile:");
  console.log(`  Name: ${context.childProfile.name}`);
  console.log(`  Age: ${context.childProfile.age}`);
  console.log(`  Interests: ${context.childProfile.interests.join(", ")}`);

  // Step 2: Create synopsis from child's request
  console.log("\n" + "=".repeat(50));
  console.log("\nStep 2: Creating story synopsis...\n");

  const childRequest = "I want a story about butterflies!";
  console.log(`Child's request: "${childRequest}"\n`);

  const synopsis = await storytime.createSynopsis(childRequest);

  console.log(`Story Title: ${synopsis.title}`);
  console.log(`Premise: ${synopsis.premise}`);
  console.log(`Theme: ${synopsis.theme}`);
  console.log(`Moral: ${synopsis.moralLesson}`);
  console.log(`Pages: ${synopsis.estimatedPages}`);
  console.log("\nCharacters:");
  synopsis.mainCharacters.forEach(c => {
    console.log(`  - ${c.name} (${c.role}): ${c.description}`);
  });

  // Step 3: Stream the story
  console.log("\n" + "=".repeat(50));
  console.log("\nStep 3: Telling the story...\n");

  let storyContent = `# ${synopsis.title}\n\n`;
  storyContent += `*${synopsis.premise}*\n\n`;
  storyContent += `**Theme:** ${synopsis.theme} | **Moral:** ${synopsis.moralLesson}\n\n`;
  storyContent += `---\n\n`;

  for await (const page of storytime.tellStory(synopsis)) {
    console.log(`\n--- Page ${page.pageNumber} ---\n`);
    console.log(page.content);

    storyContent += `## Page ${page.pageNumber}\n\n`;
    storyContent += `${page.content}\n\n`;

    if (page.interactionPrompt) {
      console.log(`\n[Interaction: ${page.interactionPrompt}]`);
      storyContent += `> *Interaction: ${page.interactionPrompt}*\n\n`;
    }
    if (page.suggestedPause) {
      console.log(`\n[Pause for child's response]`);
      storyContent += `> *[Pause for child's response]*\n\n`;
    }
  }

  storyContent += `---\n\n*The End! Sweet dreams...*\n`;

  // Write story to file
  const filename = `story-${Date.now()}.md`;
  writeFileSync(filename, storyContent);
  console.log(`\nStory saved to: ${filename}`);

  console.log("\n" + "=".repeat(50));
  console.log("\nThe End! Sweet dreams...\n");
}

// Run the example
main().catch(console.error);
