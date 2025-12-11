import type { OnboardingData, StoryResponse } from './types.js';

// Extended story response with user association
interface StoredStory extends StoryResponse {
  userId: string;
}

// In-memory storage for hackathon demo
class Store {
  private users: Map<string, OnboardingData> = new Map();
  private stories: Map<string, StoredStory> = new Map();

  // User operations
  saveUser(user: OnboardingData): void {
    this.users.set(user.id, user);
  }

  getUser(id: string): OnboardingData | undefined {
    return this.users.get(id);
  }

  updateUserVoice(userId: string, voiceId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.chosenVoiceId = voiceId;
    return true;
  }

  // Story operations
  saveStory(story: StoryResponse, userId: string): void {
    this.stories.set(story.storyId, { ...story, userId });
  }

  getStory(id: string): StoryResponse | undefined {
    return this.stories.get(id);
  }

  getLatestStoryForUser(userId: string): StoryResponse | undefined {
    const userStories = Array.from(this.stories.values())
      .filter((story) => story.userId === userId);
    if (userStories.length === 0) return undefined;
    return userStories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }

  getStoriesForUser(userId: string): StoryResponse[] {
    return Array.from(this.stories.values())
      .filter((story) => story.userId === userId);
  }

  getAllStories(): StoryResponse[] {
    return Array.from(this.stories.values());
  }
}

// Export singleton instance
export const store = new Store();

