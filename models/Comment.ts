import mongoose, { Schema } from 'mongoose';

const CommentSchema = new Schema(
  {
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

CommentSchema.index({ post: 1, status: 1, createdAt: -1 });

export default mongoose.models.Comment || mongoose.model('Comment', CommentSchema);
