import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  image: string;
  author: {
    name: string;
    role: string;
    image: string;
  };
  tags: string[];
  readTime: string;
  views: number;
  likes: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PostSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, required: true },
    image: { type: String, required: true },
    author: {
      name: { type: String, required: true },
      role: { type: String, required: true },
      image: { type: String, required: true },
    },
    tags: { type: [String], default: [] },
    readTime: { type: String, required: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent overwrite model error in development
export default mongoose.models.Post || mongoose.model<IPost>('Post', PostSchema);
