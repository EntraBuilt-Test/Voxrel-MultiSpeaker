import { IProject, ProjectStatus, ProjectType } from '@/types/project.interface.js';
import { model, Schema } from 'mongoose';

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: Object.values(ProjectType),
      required: [true, 'Project type is required'],
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.ACTIVE,
    },
    supportedLanguages: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },

    admins: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    joinRequests: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const Project = model<IProject>('Project', projectSchema);

export default Project;
