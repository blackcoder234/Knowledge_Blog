import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Hashed, optional for social login
    role: { type: String, enum: ['user', 'admin', 'editor', 'super_admin'], default: 'user' },
    image: { type: String, default: 'https://placehold.co/100x100/111/FFF?text=User' },
    bio: { type: String, default: '' },
    title: { type: String, default: '' }, // e.g. "Senior Editor"
    qualification: { type: String, default: '' }, // e.g. "PhD in Astrophysics"
    occupation: { type: String, default: '' }, // e.g. "Freelance Science Writer"
    location: { type: String, default: '' }, // e.g. "New York, USA"
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
