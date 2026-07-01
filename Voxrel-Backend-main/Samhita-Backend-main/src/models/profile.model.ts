import { IProfile } from '@/types/profile.interface.js';
import { model, Schema } from 'mongoose';

const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    languages: {
      type: [String],
      required: true,
    },
    bio: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const Profile = model<IProfile>('Profile', profileSchema);

export default Profile;
