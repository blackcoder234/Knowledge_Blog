import mongoose from "mongoose";

export const NEWSLETTER_STALE_SEND_AFTER_MS = 15 * 60 * 1000;

const NewsletterSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String, // HTML content
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sending", "sent", "scheduled"],
      default: "draft",
    },
    sendingAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    providerId: {
      type: String, // ID returned by Buttondown/Resend
    },
    stats: {
      opens: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

export default mongoose.models.Newsletter ||
  mongoose.model("Newsletter", NewsletterSchema);
