import mongoose, { Schema, Document } from "mongoose";

export interface IPostRevision extends Document {
  postId: mongoose.Types.ObjectId;
  title: string;
  excerpt: string;
  content: string; // Legacy/Fallback
  contentJson?: any; // The important part
  author: mongoose.Types.ObjectId; // Who made the edit (or who was the author at the time)
  tags: string[];
  image: string;
  createdAt: Date;
}

const PostRevisionSchema: Schema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    title: { type: String, required: true },
    excerpt: { type: String },
    content: { type: String },
    contentJson: { type: Schema.Types.Mixed },
    author: { type: Schema.Types.ObjectId, ref: "User" }, 
    tags: { type: [String] },
    image: { type: String },
  },
  { timestamps: true } // This gives us createdAt automatically
);

// Prevent overwrite in dev
export default mongoose.models.PostRevision ||
  mongoose.model<IPostRevision>("PostRevision", PostRevisionSchema);
