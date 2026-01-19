import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPageView extends Document {
  ip: string; // Optional: Link to visitor or just store IP
  path: string;
  createdAt: Date;
}

const PageViewSchema: Schema = new Schema({
  ip: { type: String, required: true, index: true }, // Indexed for aggregation
  path: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '365d' }, // Auto-delete after 1 year? Optional.
});

// Force recompilation in dev
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.PageView;
}

const PageView: Model<IPageView> = mongoose.models.PageView || mongoose.model<IPageView>('PageView', PageViewSchema);

export default PageView;
