import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIRateLimit extends Document {
  key: string;
  count: number;
  resetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIRateLimitSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, default: 0 },
    resetAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AIRateLimit;
}

const AIRateLimit: Model<IAIRateLimit> =
  mongoose.models.AIRateLimit ||
  mongoose.model<IAIRateLimit>("AIRateLimit", AIRateLimitSchema);

export default AIRateLimit;

