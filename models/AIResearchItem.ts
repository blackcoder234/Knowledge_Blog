import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIResearchItem extends Document {
  sourceId: mongoose.Types.ObjectId;
  title: string;
  url: string;
  authorOrPublisher?: string;
  publishedAt?: Date;
  contentHash: string;
  summary: string;
  extractedKeyClaims: string[];
  suggestedTags: string[];
  status: "raw" | "processed" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const AIResearchItemSchema: Schema = new Schema(
  {
    sourceId: {
      type: Schema.Types.ObjectId,
      ref: "AIResearchSource",
      required: true,
      index: true,
    },
    title: { type: String, required: true },
    url: { type: String, required: true },
    authorOrPublisher: { type: String },
    publishedAt: { type: Date },
    contentHash: { type: String, required: true, unique: true, index: true },
    summary: { type: String, default: "" },
    extractedKeyClaims: { type: [String], default: [] },
    suggestedTags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["raw", "processed", "archived"],
      default: "raw",
      index: true,
    },
  },
  { timestamps: true }
);

AIResearchItemSchema.index({ publishedAt: -1 });

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AIResearchItem;
}

const AIResearchItem: Model<IAIResearchItem> =
  mongoose.models.AIResearchItem ||
  mongoose.model<IAIResearchItem>("AIResearchItem", AIResearchItemSchema);

export default AIResearchItem;
