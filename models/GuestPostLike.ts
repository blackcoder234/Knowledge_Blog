import mongoose, { Schema } from "mongoose";

const GuestPostLikeSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    visitorHash: { type: String, required: true },
  },
  { timestamps: true },
);

GuestPostLikeSchema.index({ postId: 1, visitorHash: 1 }, { unique: true });

export default mongoose.models.GuestPostLike ||
  mongoose.model("GuestPostLike", GuestPostLikeSchema);
