import mongoose, { Schema } from 'mongoose';

const SubscriberSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
    source: { type: String, default: 'homepage' }, // where they subscribed from
  },
  { timestamps: true }
);

export default mongoose.models.Subscriber || mongoose.model('Subscriber', SubscriberSchema);
