import { IUser, IUserModel, UserRole, UserStatus } from '@/types/user.interface.js';
import bcrypt from 'bcryptjs';
import { model, Schema } from 'mongoose';

const userSchema = new Schema<IUser, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide your name'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false, // Hide password by default
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.FREELANCER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING_VERIFICATION,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Pre-save hook for password hashing
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare passwords
userSchema.methods.isPasswordMatch = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = model<IUser, IUserModel>('User', userSchema);

export default User;
