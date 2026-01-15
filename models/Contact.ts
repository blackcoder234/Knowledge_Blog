import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
