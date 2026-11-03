import { randomUUID } from "node:crypto";
import mongoose, { type QueryFilter } from "mongoose";
import AIContentOpportunity, { type IAIContentOpportunity } from "@/models/AIContentOpportunity";

const LEASE_DURATION_MS = 5 * 60 * 1000;
const HEARTBEAT_INTERVAL_MS = 60 * 1000;
const RECOVERABLE_STATUSES = ["new", "approved", "failed", "discovery", "ready_to_draft"] as const;

export async function claimConversionJob(opportunityId: string, now = new Date()) {
  const jobId = randomUUID();
  const staleBefore = new Date(now.getTime() - LEASE_DURATION_MS);
  const filter: QueryFilter<IAIContentOpportunity> = {
    _id: new mongoose.Types.ObjectId(opportunityId),
    $or: [
      { status: { $in: RECOVERABLE_STATUSES } },
      {
        status: "converting",
        $or: [
          { conversionLeaseUntil: { $lt: now } },
          {
            conversionLeaseUntil: { $exists: false },
            updatedAt: { $lt: staleBefore },
          },
        ],
      },
    ],
  };
  const claimed = await AIContentOpportunity.findOneAndUpdate(
    filter,
    {
      $set: {
        status: "converting",
        jobId,
        conversionLeaseUntil: new Date(now.getTime() + LEASE_DURATION_MS),
      },
    },
    { returnDocument: "after" },
  );
  return claimed ? { jobId } : null;
}

export async function renewConversionLease(opportunityId: string, jobId: string, now = new Date()) {
  const renewed = await AIContentOpportunity.findOneAndUpdate(
    { _id: opportunityId, status: "converting", jobId },
    { $set: { conversionLeaseUntil: new Date(now.getTime() + LEASE_DURATION_MS) } },
    { returnDocument: "after", projection: { _id: 1 } },
  );
  return Boolean(renewed);
}

export function startConversionHeartbeat(opportunityId: string, jobId: string) {
  let leaseOwned = false;
  let inFlight = false;
  const renew = async () => {
    if (inFlight || !leaseOwned) return;
    inFlight = true;
    try {
      leaseOwned = await renewConversionLease(opportunityId, jobId);
    } catch (error) {
      leaseOwned = false;
      console.error("Could not renew AI conversion lease; treating job as expired:", error);
    } finally {
      inFlight = false;
    }
  };
  const ready = (async () => {
    inFlight = true;
    try {
      leaseOwned = await renewConversionLease(opportunityId, jobId);
      return leaseOwned;
    } catch (error) {
      console.error("Could not establish AI conversion lease; treating job as expired:", error);
      return false;
    } finally {
      inFlight = false;
    }
  })();
  const timer = setInterval(renew, HEARTBEAT_INTERVAL_MS);
  timer.unref?.();

  return {
    ready,
    ownsLease: () => leaseOwned,
    stop: () => clearInterval(timer),
  };
}

export async function completeConversionJob(
  opportunityId: string,
  jobId: string,
  postId: unknown,
) {
  const updated = await AIContentOpportunity.findOneAndUpdate(
    { _id: opportunityId, status: "converting", jobId },
    {
      $set: { status: "draft_ready", convertedPostId: postId },
      $unset: { jobId: 1, conversionLeaseUntil: 1, lastError: 1 },
    },
    { returnDocument: "after", projection: { _id: 1 } },
  );
  return Boolean(updated);
}

export async function failConversionJob(opportunityId: string, jobId: string, message: string) {
  const updated = await AIContentOpportunity.findOneAndUpdate(
    { _id: opportunityId, status: "converting", jobId },
    {
      $set: { status: "failed", lastError: message },
      $inc: { retryCount: 1 },
      $unset: { jobId: 1, conversionLeaseUntil: 1 },
    },
    { returnDocument: "after", projection: { _id: 1 } },
  );
  return Boolean(updated);
}

export async function releaseConversionJob(
  opportunityId: string,
  jobId: string,
  status: string,
) {
  const updated = await AIContentOpportunity.findOneAndUpdate(
    { _id: opportunityId, status: "converting", jobId },
    {
      $set: { status },
      $unset: { jobId: 1, conversionLeaseUntil: 1 },
    },
    { returnDocument: "after", projection: { _id: 1 } },
  );
  return Boolean(updated);
}

export async function recoverConversionPost(opportunityId: string, postId: unknown) {
  const updated = await AIContentOpportunity.findOneAndUpdate(
    { _id: opportunityId, status: { $ne: "published" } },
    {
      $set: { status: "draft_ready", convertedPostId: postId },
      $unset: { jobId: 1, conversionLeaseUntil: 1, lastError: 1 },
    },
    { returnDocument: "after", projection: { _id: 1 } },
  );
  return Boolean(updated);
}
