import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMedia extends Document {
  url: string;
  publicId: string;
  filename: string;
  format: string;
  size: number;
  width: number;
  height: number;
  folder: string;
  altText?: string;
  createdAt: Date;
}

const MediaSchema: Schema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true, unique: true },
    filename: { type: String },
    format: { type: String },
    size: { type: Number }, // in bytes
    width: { type: Number },
    height: { type: Number },
    folder: { type: String, default: 'general' },
    altText: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent re-compilation error in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Media;
}

const Media: Model<IMedia> = mongoose.models.Media || mongoose.model<IMedia>('Media', MediaSchema);

export default Media;
