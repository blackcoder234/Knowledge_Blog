import mongoose, { Schema, Document } from "mongoose";

// ... (imports remain the same)

export interface IPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: any; // Populated Category | ObjectId
  language: string;
  image: string;
  author: any; // Populated User | ObjectId
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
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    language: { type: String, default: "English" }, // Added language field
    image: { type: String, required: true },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
