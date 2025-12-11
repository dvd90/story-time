import { Schema, model, type Document } from 'mongoose';

export interface IUser extends Document {
  clerkId: string;
  parentName?: string;
  childName?: string;
  chosenVoice?: string;
  chosenVoiceId?: string;
  anamVoiceId?: string;
  anamPersonaId?: string;
  onboardingComplete: boolean;
  voiceRecordingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    parentName: {
      type: String,
      trim: true,
    },
    childName: {
      type: String,
      trim: true,
    },
    chosenVoice: {
      type: String,
      trim: true,
    },
    chosenVoiceId: {
      type: String,
      default: null,
    },
    anamVoiceId: {
      type: String,
      default: null,
    },
    anamPersonaId: {
      type: String,
      default: null,
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    voiceRecordingUrl: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = model<IUser>('User', userSchema);
