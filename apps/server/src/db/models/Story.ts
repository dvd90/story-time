import { Schema, model, type Document } from 'mongoose';

export type StoryMode = 'predefined' | 'generated' | 'previous';

export interface IStory extends Document {
  storyId: string;
  clerkUserId: string;
  mode: StoryMode;
  text: string;
  paragraphs: string[];
  createdAt: Date;
  updatedAt: Date;
}

const storySchema = new Schema<IStory>(
  {
    storyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clerkUserId: {
      type: String,
      required: true,
      index: true,
    },
    mode: {
      type: String,
      required: true,
      enum: ['predefined', 'generated', 'previous'],
    },
    text: {
      type: String,
      required: true,
    },
    paragraphs: {
      type: [String],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient user story lookups
storySchema.index({ clerkUserId: 1, createdAt: -1 });

export const Story = model<IStory>('Story', storySchema);

