import { ITask, TaskPriority, TaskStatus, TaskType } from '@/types/task.interface.js';
import { model, Schema } from 'mongoose';

const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(TaskPriority),
      required: false,
    },
    tags: {
      type: [String],
      required: false,
    },
    language: {
      type: String,
      required: true,
    },
    deadline: {
      type: Date,
      required: false,
    },
    audioUrl: {
      type: String,
      required: false, // Made optional to support audioUrls
    },
    audioUrls: {
      type: [String],
      default: undefined,
    },
    submission: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.OPEN,
    },
    claimedById: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: false, // Optional for now to support legacy tasks
    },
    type: {
      type: String,
      enum: Object.values(TaskType),
      default: TaskType.SINGLE,
    },
    roomName: {
      type: String,
      required: false,
    },
    assignedFreelancers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Recording fields for multi-speaker tasks
    recordingEgressId: {
      type: String,
      required: false,
    },
    recordingStartedAt: {
      type: Date,
      required: false,
    },
    recordingUrl: {
      type: String,
      required: false,
    },
    recordingFileName: {
      type: String,
      required: false,
    },
    recordingDuration: {
      type: Number,
      required: false,
    },
    recordingCompletedAt: {
      type: Date,
      required: false,
    },
    recordingStatus: {
      type: String,
      enum: ['RECORDING', 'COMPLETED', 'FAILED'],
      required: false,
    },
    // Speaker metadata for single-speaker tasks
    speakerName: {
      type: String,
      required: false,
    },
    speakerAge: {
      type: Number,
      required: false,
    },
    speakerLocation: {
      type: String,
      required: false,
    },
    // Speaker metadata for multi-speaker tasks
    speakersMetadata: [
      {
        freelancerId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        speakerLabel: { type: String, required: false, default: 'Speaker 1' },
        name: { type: String, required: true },
        age: { type: Number, required: true },
        gender: { type: String },
        qualification: { type: String },
        occupation: { type: String },
        motherTongue: { type: String },
        nativePlace: { type: String },
        location: { type: String, required: true },
        district: { type: String },
        state: { type: String },
        dialectZone: { type: String },
        recordingDevice: { type: String },
        recordingEnvironment: { type: String },
      },
    ],
    spawnedFrom: {
      taskId: { type: Schema.Types.ObjectId, ref: 'Task' },
      projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: false },
    },
  },
  { timestamps: true }
);

// Schema-level validation check removed to allow tasks without audioUrl (e.g. self-recording)
/*
taskSchema.pre('validate', function (next) {
  if (!this.audioUrl && (!this.audioUrls || this.audioUrls.length === 0)) {
    next(new Error('Either audioUrl or audioUrls with at least one URL is required'));
  } else {
    next();
  }
});
*/

const Task = model<ITask>('Task', taskSchema);

export default Task;
