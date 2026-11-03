import dbConnect from "@/lib/db";
import AIAuditLog, { IAIAuditLog } from "@/models/AIAuditLog";
import mongoose from "mongoose";

export interface LogAIActionParams {
  action: IAIAuditLog["action"];
  actorType: "ai" | "user";
  actorId?: string | mongoose.Types.ObjectId;
  targetPostId?: string | mongoose.Types.ObjectId;
  targetOpportunityId?: string | mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  ipAddress?: string;
}

export async function logAIStudioAction(params: LogAIActionParams) {
  try {
    await dbConnect();
    await AIAuditLog.create({
      action: params.action,
      actorType: params.actorType,
      actorId: params.actorId || undefined,
      targetPostId: params.targetPostId || undefined,
      targetOpportunityId: params.targetOpportunityId || undefined,
      metadata: params.metadata || {},
      ipAddress: params.ipAddress || undefined,
    });
  } catch (error) {
    console.error("Failed to write to AIAuditLog:", error);
    // Non-blocking: audit failure should not crash primary editorial flow
  }
}

