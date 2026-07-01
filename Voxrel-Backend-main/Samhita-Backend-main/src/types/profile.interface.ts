import { Document, Types } from 'mongoose';

export interface IProfile extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bio?: string;
  languages: string[];
  country: string;
  createdAt: Date;
  updatedAt: Date;
}
