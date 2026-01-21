import mongoose, { Schema, Document } from "mongoose";

// ... (imports remain the same)

export interface IPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  language: string;
  image: string;
  author: {
    name: string;
    email: string; // Added email
    role: string;
    image: string;
  };
  tags: string[];
  readTime: string;
  views: number;
  likes: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
  // SEO Metadata
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noindex?: boolean;
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
    language: { type: String, default: "English" }, // Added language field
    image: { type: String, required: true },
    author: {
      name: { type: String, required: true },
      email: { type: String, required: true }, // Added email for stable permissions
      role: { type: String, required: true },
      image: { type: String, required: true },
    },
    tags: { type: [String], default: [] },
    readTime: { type: String, required: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    // SEO Fields
    seoTitle: { type: String },
    seoDescription: { type: String },
    canonicalUrl: { type: String },
    ogImage: { type: String },
    noindex: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// ... (export remains the same)

// Prevent overwrite model error in development
export default mongoose.models.Post ||
  mongoose.model<IPost>("Post", PostSchema);
