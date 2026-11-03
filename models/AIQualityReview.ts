import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIQualityReview extends Document {
  postId: mongoose.Types.ObjectId;
  overallScore: number;
  passed: boolean;
  highRiskTopic?: boolean;
  claimsBreakdown?: Array<{
    claim: string;
    status: "supported" | "partially_supported" | "unsupported" | "opinion";
    sourceUrl?: string;
    riskLevel: string;
  }>;
  checks: {
    sourceFreshness: {
      score: number;
      staleCount: number;
      unknownCount: number;
    };
    sourceCoverage: {
      score: number;
      details: string;
      sourceCount: number;
    };
    unsupportedClaims: {
      detected: boolean;
      claims: string[];
    };
    duplicateRisk: {
      score: number;
      conflictingPostSlug?: string;
      conflictingPostTitle?: string;
    };
    misinformationFlags: {
      flagged: boolean;
      notes: string;
    };
    plagiarismRisk: {
      score: number;
      highestOverlapUrl?: string;
    };
    sourceOverlapRisk?: {
      score: number;
      details?: string;
    };
    seoCompleteness: {
      passed: boolean;
      missingFields: string[];
    };
    readabilityScore: {
      fleschScore: number;
      gradeLevel: string;
    };
    editorialVoice: {
      score: number;
      styleNotes: string;
    };
  };
  recommendations: string[];
  reviewedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIQualityReviewSchema: Schema = new Schema(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    overallScore: { type: Number, required: true },
    passed: { type: Boolean, default: false },
    highRiskTopic: { type: Boolean, default: false },
    claimsBreakdown: [
      {
        claim: { type: String },
        status: {
          type: String,
          enum: ["supported", "partially_supported", "unsupported", "opinion"],
          default: "supported",
        },
        sourceUrl: { type: String },
        riskLevel: { type: String, default: "low" },
      },
    ],
    checks: {
      sourceFreshness: {
        score: { type: Number, default: 100 },
        staleCount: { type: Number, default: 0 },
        unknownCount: { type: Number, default: 0 },
      },
      sourceCoverage: {
        score: { type: Number, default: 100 },
        details: { type: String, default: "" },
        sourceCount: { type: Number, default: 0 },
      },
      unsupportedClaims: {
        detected: { type: Boolean, default: false },
        claims: { type: [String], default: [] },
      },
      duplicateRisk: {
        score: { type: Number, default: 0 },
        conflictingPostSlug: { type: String },
        conflictingPostTitle: { type: String },
      },
      misinformationFlags: {
        flagged: { type: Boolean, default: false },
        notes: { type: String, default: "" },
      },
      plagiarismRisk: {
        score: { type: Number, default: 0 },
        highestOverlapUrl: { type: String },
      },
      sourceOverlapRisk: {
        score: { type: Number, default: 0 },
        details: { type: String, default: "" },
      },
      seoCompleteness: {
        passed: { type: Boolean, default: true },
        missingFields: { type: [String], default: [] },
      },
      readabilityScore: {
        fleschScore: { type: Number, default: 65 },
        gradeLevel: { type: String, default: "Standard / Conversational" },
      },
      editorialVoice: {
        score: { type: Number, default: 90 },
        styleNotes: { type: String, default: "" },
      },
    },
    recommendations: { type: [String], default: [] },
    reviewedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AIQualityReview;
}

const AIQualityReview: Model<IAIQualityReview> =
  mongoose.models.AIQualityReview ||
  mongoose.model<IAIQualityReview>("AIQualityReview", AIQualityReviewSchema);

export default AIQualityReview;
