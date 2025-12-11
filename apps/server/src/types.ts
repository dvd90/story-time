// User onboarding data
export interface OnboardingData {
  id: string;
  parentName: string;
  childName: string;
  chosenVoice: string;
  chosenVoiceId?: string;
  createdAt: Date;
}

// Story generation modes
export type StoryMode = 'predefined' | 'generated' | 'previous';

// Story request
export interface StoryStartRequest {
  mode: StoryMode;
  userId?: string;
}

// Story response
export interface StoryResponse {
  storyId: string;
  mode: StoryMode;
  text: string;
  paragraphs: string[];
  createdAt: Date;
}

// Audio chunks request
export interface AudioChunksRequest {
  storyText: string;
  voiceId?: string;
}

// Audio chunk
export interface AudioChunk {
  index: number;
  text: string;
  duration?: number;
}

// Audio chunks response
export interface AudioChunksResponse {
  chunks: AudioChunk[];
  voiceId: string;
  totalChunks: number;
}

