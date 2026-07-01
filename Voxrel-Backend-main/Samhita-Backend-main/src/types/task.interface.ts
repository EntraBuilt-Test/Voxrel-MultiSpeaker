import { Document, Types } from 'mongoose';

export enum TaskStatus {
  OPEN = 'OPEN',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  ASSIGNED = 'ASSIGNED',
  SUBMITTED = 'SUBMITTED',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum TaskType {
  SINGLE = 'single',
  MULTI = 'multi',
}

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  price: number;
  priority?: TaskPriority;
  tags?: string[];
  language: string;
  deadline?: Date;
  audioUrl?: string; // Single URL for backward compatibility
  audioUrls?: string[]; // Multiple URLs for bulk uploads
  submission?: string;
  status: TaskStatus;
  claimedById?: Types.ObjectId;
  projectId?: Types.ObjectId;
  type?: TaskType; // 'single' | 'multi', defaults to 'single'
  roomName?: string; // Auto-generated for multi-speaker tasks
  assignedFreelancers?: Types.ObjectId[]; // Array of freelancer IDs for multi-speaker tasks
  // Recording fields for multi-speaker tasks
  recordingEgressId?: string; // LiveKit egress ID (temporary, cleared when recording completes)
  recordingStartedAt?: Date; // When recording started
  recordingUrl?: string; // Final R2 URL of the recording
  recordingFileName?: string; // File name in R2
  recordingDuration?: number; // Duration in seconds
  recordingCompletedAt?: Date; // When recording completed
  recordingStatus?: 'RECORDING' | 'COMPLETED' | 'FAILED'; // Recording status
  // Speaker metadata for single-speaker tasks
  speakerName?: string;
  speakerAge?: number;
  speakerLocation?: string;
  // Speaker metadata for multi-speaker tasks
  speakersMetadata?: Array<{
    freelancerId: Types.ObjectId;
    speakerLabel?: string;
    name: string;
    age: number;
    gender?: string;
    qualification?: string;
    occupation?: string;
    motherTongue?: string;
    nativePlace?: string;
    location: string;
    district?: string;
    state?: string;
    dialectZone?: string;
    recordingDevice?: string;
    recordingEnvironment?: string;
  }>;
  spawnedFrom?: {
    taskId: Types.ObjectId;
    projectId?: Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
}
