import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIResearchSource extends Document {
  name: string;
  url: string;
  publisher: string;
  sourceType: "rss" | "api" | "academic";
  category?: mongoose.Types.ObjectId;
  topics: string[];
  trustTier: "verified" | "primary" | "secondary";
  approvalStatus: "approved" | "pending" | "rejected";
  active: boolean;
  fetchIntervalMinutes: number;
  lastFetchedAt?: Date;
  lastError?: string;
  fetchLockId?: string;
  fetchLockUntil?: Date;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AIResearchSourceSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true, unique: true },
    publisher: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ["rss", "api", "academic"],
      default: "rss",
    },
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    topics: { type: [String], default: [] },
    trustTier: {
      type: String,
      enum: ["verified", "primary", "secondary"],
      default: "verified",
    },
    approvalStatus: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "approved",
      index: true,
    },
    active: { type: Boolean, default: true },
    fetchIntervalMinutes: { type: Number, default: 360 }, // Every 6 hours
    lastFetchedAt: { type: Date },
    lastError: { type: String },
    fetchLockId: { type: String },
    fetchLockUntil: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AIResearchSourceSchema.index({ active: 1, lastFetchedAt: 1 });

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AIResearchSource;
}

const AIResearchSource: Model<IAIResearchSource> =
  mongoose.models.AIResearchSource ||
  mongoose.model<IAIResearchSource>("AIResearchSource", AIResearchSourceSchema);

export default AIResearchSource;
