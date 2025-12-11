import { User, Story, type IUser, type IStory, type StoryMode } from './db/index.js';

// Response types for API compatibility
export interface OnboardingData {
  id: string;
  parentName?: string;
  childName?: string;
  chosenVoice?: string;
  chosenVoiceId?: string;
  anamVoiceId?: string;
  anamPersonaId?: string;
  onboardingComplete: boolean;
  createdAt: Date;
}

export interface StoryResponse {
  storyId: string;
  mode: StoryMode;
  text: string;
  paragraphs: string[];
  createdAt: Date;
}

// MongoDB-backed store
class Store {
  // User operations
  async saveUser(
    clerkId: string,
    data: Partial<Omit<OnboardingData, 'id' | 'createdAt'>>
  ): Promise<OnboardingData> {
    const user = await User.findOneAndUpdate(
      { clerkId },
      {
        clerkId,
        ...data,
      },
      { upsert: true, new: true }
    );

    return this.toOnboardingData(user);
  }

  async getUser(clerkId: string): Promise<OnboardingData | null> {
    const user = await User.findOne({ clerkId });
    return user ? this.toOnboardingData(user) : null;
  }

  async updateUserVoice(clerkId: string, voiceId: string): Promise<boolean> {
    const result = await User.updateOne({ clerkId }, { chosenVoiceId: voiceId });
    return result.modifiedCount > 0;
  }

  async updateUserVoiceClone(
    clerkId: string,
    anamVoiceId: string,
    anamPersonaId?: string
  ): Promise<boolean> {
    const result = await User.updateOne(
      { clerkId },
      {
        anamVoiceId,
        ...(anamPersonaId && { anamPersonaId }),
      }
    );
    return result.modifiedCount > 0 || result.upsertedCount > 0;
  }

  async completeOnboarding(clerkId: string): Promise<boolean> {
    const result = await User.updateOne({ clerkId }, { onboardingComplete: true });
    return result.modifiedCount > 0;
  }

  // Story operations
  async saveStory(
    clerkUserId: string,
    data: Omit<StoryResponse, 'createdAt'>
  ): Promise<StoryResponse> {
    const story = await Story.create({
      storyId: data.storyId,
      clerkUserId,
      mode: data.mode,
      text: data.text,
      paragraphs: data.paragraphs,
    });

    return this.toStoryResponse(story);
  }

  async getStory(storyId: string): Promise<StoryResponse | null> {
    const story = await Story.findOne({ storyId });
    return story ? this.toStoryResponse(story) : null;
  }

  async getLatestStoryForUser(clerkUserId: string): Promise<StoryResponse | null> {
    const story = await Story.findOne({ clerkUserId }).sort({ createdAt: -1 }).limit(1);
    return story ? this.toStoryResponse(story) : null;
  }

  async getStoriesForUser(clerkUserId: string): Promise<StoryResponse[]> {
    const stories = await Story.find({ clerkUserId }).sort({ createdAt: -1 });
    return stories.map((s) => this.toStoryResponse(s));
  }

  // Transform helpers
  private toOnboardingData(user: IUser): OnboardingData {
    return {
      id: user.clerkId,
      parentName: user.parentName,
      childName: user.childName,
      chosenVoice: user.chosenVoice,
      chosenVoiceId: user.chosenVoiceId,
      anamVoiceId: user.anamVoiceId,
      anamPersonaId: user.anamPersonaId,
      onboardingComplete: user.onboardingComplete,
      createdAt: user.createdAt,
    };
  }

  private toStoryResponse(story: IStory): StoryResponse {
    return {
      storyId: story.storyId,
      mode: story.mode,
      text: story.text,
      paragraphs: story.paragraphs,
      createdAt: story.createdAt,
    };
  }
}

// Export singleton instance
export const store = new Store();
