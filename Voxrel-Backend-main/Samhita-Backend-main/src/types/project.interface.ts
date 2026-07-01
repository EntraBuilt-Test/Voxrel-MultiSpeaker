/* eslint-disable @typescript-eslint/no-explicit-any */
import { Document, Types } from 'mongoose';

export enum ProjectType {
  AUDIO_RECORDING = 'AUDIO_RECORDING',
  TRANSCRIPTION = 'TRANSCRIPTION',
  REVIEW = 'REVIEW',
  FUTURE = 'FUTURE',
}

export enum ProjectStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ARCHIVED = 'ARCHIVED',
  COMPLETED = 'COMPLETED',
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  type: ProjectType;
  status: ProjectStatus;
  supportedLanguages?: string[];
  metadata?: Record<string, any>;
  admins?: Types.ObjectId[];
  users?: Types.ObjectId[];
  joinRequests?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}
