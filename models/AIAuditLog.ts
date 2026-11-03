import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIAuditLog extends Document {
  action:
    | "opportunity_generated"
    | "brief_created"
    | "draft_generated"
    | "draft_edited"
    | "image_generated"
    | "quality_reviewed"
    | "post_approved"
    | "post_scheduled"
    | "archive_recommended"
    | "limit_exceeded"
    | "settings_updated"
    | "source_synced";
  actorType: "ai" | "user";
  actorId?: mongoose.Types.ObjectId;
  targetPostId?: mongoose.Types.ObjectId;
  targetOpportunityId?: mongoose.Types.ObjectId;
  metadata: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const AIAuditLogSchema: Schema = new Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    actorType: {
      type: String,
      enum: ["ai", "user"],
      required: true,
    },
    actorId: { type: Schema.Types.ObjectId, ref: "User" },
    targetPostId: { type: Schema.Types.ObjectId, ref: "Post" },
    targetOpportunityId: {
      type: Schema.Types.ObjectId,
      ref: "AIContentOpportunity",
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

AIAuditLogSchema.index({ createdAt: -1 });

if (process.env.NODE_ENV === "development") {
  delete mongoose.models.AIAuditLog;
}

const AIAuditLog: Model<IAIAuditLog> =
  mongoose.models.AIAuditLog ||
  mongoose.model<IAIAuditLog>("AIAuditLog", AIAuditLogSchema);

export default AIAuditLog;

