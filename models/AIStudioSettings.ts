import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIStudioSettings extends Document {
  provider: "gemini" | "openai";
  modelName: string;
  allowCrossProviderFailover: boolean;
  editorialVoiceInstructions: string;
  qualityThresholds: {
    minOverallScore: number;
    minSourceFreshnessDays: number;
    maxDuplicateRiskScore: number;
    minReadabilityScore: number;
  };
  autoSchedulingPolicy: {
    enabled: boolean;
    allowedCategories: mongoose.Types.ObjectId[];
    minQualityScoreRequired: number;
    publishBufferHours: number;
  };
  dailyLimits: {
    maxDailyResearchFetches: number;
    maxDailyDraftGenerations: number;
  };
  killSwitch: boolean;
  retentionDays: number;
  approvedDomains: string[];
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AIStudioSettingsSchema: Schema = new Schema(
  {
    provider: {
      type: String,
      enum: ["gemini", "openai"],
      default: "gemini",
    },
    modelName: {
      type: String,
      default: "gemini-3.8-flash",
    },
    allowCrossProviderFailover: {
      type: Boolean,
      default: false,
    },
    editorialVoiceInstructions: {
      type: String,
      default:
        "KnowledgeLog voice: Clear, thoughtful, intellectually honest, depth over hype, no clickbait, no unsupported certainty. Explain complex concepts cleanly with concrete examples and robust citations.",
    },
    qualityThresholds: {
      minOverallScore: { type: Number, default: 80 },
      minSourceFreshnessDays: { type: Number, default: 30 },
      maxDuplicateRiskScore: { type: Number, default: 30 },
      minReadabilityScore: { type: Number, default: 55 },
    },
    autoSchedulingPolicy: {
      enabled: { type: Boolean, default: false }, // Disabled by default, super_admin only
      allowedCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      minQualityScoreRequired: { type: Number, default: 90 },
      publishBufferHours: { type: Number, default: 24 },
    },
    dailyLimits: {
      maxDailyResearchFetches: { type: Number, default: 50 },
      maxDailyDraftGenerations: { type: Number, default: 10 },
    },
    killSwitch: { type: Boolean, default: false },
    retentionDays: { type: Number, default: 60 },
    approvedDomains: { type: [String], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AIStudioSettings;
}

const AIStudioSettings: Model<IAIStudioSettings> =
  mongoose.models.AIStudioSettings ||
  mongoose.model<IAIStudioSettings>("AIStudioSettings", AIStudioSettingsSchema);

export default AIStudioSettings;

