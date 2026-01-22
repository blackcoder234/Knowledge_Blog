import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPageView extends Document {
  visitorId: string; // Linked to Visitor
  ip: string; 
  path: string;
  createdAt: Date;
}

const PageViewSchema: Schema = new Schema({
  visitorId: { type: String, required: true, index: true },
  ip: { type: String, required: false }, 
  path: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '365d' }, 
});

// Indexes for common analytics queries
// PageViewSchema.index({ createdAt: 1 }); // Already indexed by 'expires' TTL
PageViewSchema.index({ path: 1 });

// Force recompilation in dev
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.PageView;
}

const PageView: Model<IPageView> = mongoose.models.PageView || mongoose.model<IPageView>('PageView', PageViewSchema);

export default PageView;
