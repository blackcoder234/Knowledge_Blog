import mongoose, { Schema } from 'mongoose';

const VisitorSchema = new Schema(
  {
    visitorId: { type: String, required: true, index: true }, // Cookie ID
    ipHash: { type: String, required: true }, // Anonymized IP
    userAgent: { type: String },
    path: { type: String, required: true },
    country: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// We might want to see unique visitors per day, so visitorId is key.
export default mongoose.models.Visitor || mongoose.model('Visitor', VisitorSchema);
