import mongoose from "mongoose";

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
      enum: ["draft", "sent", "scheduled"],
      default: "draft",
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
