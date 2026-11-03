import mongoose, { Schema, Document, Model } from "mongoose";

export interface IResearchDossierItem {
  sourceUrl: string;
  publisher: string;
  retrievalDate: Date;
  publishedDate?: Date;
  relevantExcerpt: string;
  credibilityTier: "tier1_academic" | "tier2_journalism" | "tier3_community";
  claimsSupported: string[];
  isVerified: boolean;
}

export interface IScoreBreakdown {
  relevance: number;
  readerInterest: number;
  sourceCredibility: number;
  originality: number;
  timeliness: number;
  duplicatePenalty: number;
  totalScore: number;
  explanation: string;
}

export interface IAIContentOpportunity extends Document {
  proposedTitle: string;
  category?: mongoose.Types.ObjectId;
  tags: string[];
  targetReader: string;
  whyItMattersNow: string;
  audienceInterestScore: number;
  audienceInterestSignals: {
    matchedCategoryViews30d: number;
    relatedTagBookmarks: number;
    relatedCommentsCount: number;
    explanation: string;
  };
  scoreBreakdown?: IScoreBreakdown;
  primarySources: {
    title: string;
    url: string;
    publisher: string;
    publishedAt?: Date;
  }[];
  researchDossier?: IResearchDossierItem[];
  suggestedFormat: "deep-dive" | "explainer" | "analysis" | "case-study";
  estimatedReadTime: string;
  duplicateRiskScore: number;
  confidenceScore: number;
  status:
    | "discovery"
    | "new"
    | "researching"
    | "ready_to_draft"
    | "approved"
    | "converting"
    | "draft_ready"
    | "converted"
    | "in_review"
    | "published"
    | "dismissed"
    | "failed";
  convertedPostId?: mongoose.Types.ObjectId;
  jobId?: string;
  conversionLeaseUntil?: Date;
  lastError?: string;
  retryCount?: number;
  brief?: {
    thesis: string;
    outline: { section: string; keyPoints: string[] }[];
    claimsRequiringCitations: string[];
    counterarguments: string[];
    suggestedInternalLinks: string[];
    seoTitle: string;
    seoDescription: string;
    suggestedSlug: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AIContentOpportunitySchema: Schema = new Schema(
  {
    proposedTitle: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", index: true },
    tags: { type: [String], default: [] },
    targetReader: { type: String, default: "General KnowledgeLog Reader" },
    whyItMattersNow: { type: String, required: true },
    audienceInterestScore: { type: Number, default: 50, index: true },
    audienceInterestSignals: {
      matchedCategoryViews30d: { type: Number, default: 0 },
      relatedTagBookmarks: { type: Number, default: 0 },
      relatedCommentsCount: { type: Number, default: 0 },
      explanation: { type: String, default: "" },
    },
    scoreBreakdown: {
      relevance: { type: Number, default: 20 },
      readerInterest: { type: Number, default: 20 },
      sourceCredibility: { type: Number, default: 15 },
      originality: { type: Number, default: 12 },
      timeliness: { type: Number, default: 12 },
      duplicatePenalty: { type: Number, default: 0 },
      totalScore: { type: Number, default: 79 },
      explanation: { type: String, default: "" },
    },
    primarySources: [
      {
        title: { type: String, required: true },
        url: { type: String, required: true },
        publisher: { type: String, required: true },
        publishedAt: { type: Date },
      },
    ],
    researchDossier: [
      {
        sourceUrl: { type: String, required: true },
        publisher: { type: String, required: true },
        retrievalDate: { type: Date, default: Date.now },
        publishedDate: { type: Date },
        relevantExcerpt: { type: String, default: "" },
        credibilityTier: {
          type: String,
          enum: ["tier1_academic", "tier2_journalism", "tier3_community"],
          default: "tier2_journalism",
        },
        claimsSupported: { type: [String], default: [] },
        isVerified: { type: Boolean, default: false },
      },
    ],
    suggestedFormat: {
      type: String,
      enum: ["deep-dive", "explainer", "analysis", "case-study"],
      default: "deep-dive",
    },
    estimatedReadTime: { type: String, default: "6 min read" },
    duplicateRiskScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 85 },
    status: {
      type: String,
      enum: [
        "discovery",
        "new",
        "researching",
        "ready_to_draft",
        "approved",
        "converting",
        "draft_ready",
        "converted",
        "in_review",
        "published",
        "dismissed",
        "failed",
      ],
      default: "new",
      index: true,
    },
    convertedPostId: { type: Schema.Types.ObjectId, ref: "Post" },
    jobId: { type: String },
    conversionLeaseUntil: { type: Date },
    lastError: { type: String },
    retryCount: { type: Number, default: 0 },
    brief: {
      thesis: { type: String },
      outline: [
        {
          section: { type: String },
          keyPoints: { type: [String] },
        },
      ],
      claimsRequiringCitations: { type: [String] },
      counterarguments: { type: [String] },
      suggestedInternalLinks: { type: [String] },
      seoTitle: { type: String },
      seoDescription: { type: String },
      suggestedSlug: { type: String },
    },
  },
  { timestamps: true }
);

AIContentOpportunitySchema.index({ status: 1, audienceInterestScore: -1 });

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AIContentOpportunity;
}

const AIContentOpportunity: Model<IAIContentOpportunity> =
  mongoose.models.AIContentOpportunity ||
  mongoose.model<IAIContentOpportunity>(
    "AIContentOpportunity",
    AIContentOpportunitySchema
  );

export default AIContentOpportunity;
