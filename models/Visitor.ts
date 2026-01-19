import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVisitor extends Document {
  ip: string;
  country: string;
  city: string;
  browser: string;
  os: string;
  device: string;
  path: string;
  createdAt: Date;
  lastSeen: Date;
  visitCount: number;
  referrer: string;
}

const VisitorSchema: Schema = new Schema({
  ip: { type: String, required: true },
  country: { type: String, default: 'Unknown' },
  city: { type: String, default: 'Unknown' },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  device: { type: String, default: 'Desktop' },
  path: { type: String, default: '/' },
  referrer: { type: String, default: 'Direct' },
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  visitCount: { type: Number, default: 1 },
});

// Force recompilation in dev to apply schema changes
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Visitor;
}

const Visitor: Model<IVisitor> = mongoose.models.Visitor || mongoose.model<IVisitor>('Visitor', VisitorSchema);

export default Visitor;
