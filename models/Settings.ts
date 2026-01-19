import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  tagline: string;
  maintenanceMode: boolean;
  postsPerPage: number;
  seoDescription: string;
  seoKeywords: string[];
  socialLinks: {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
  contactEmail: string;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema(
  {
    siteName: { type: String, default: 'KnowledgeLog' },
    tagline: { type: String, default: 'Exploring the frontiers of technology.' },
    maintenanceMode: { type: Boolean, default: false },
    postsPerPage: { type: Number, default: 10 },
    seoDescription: { type: String, default: '' },
    seoKeywords: { type: [String], default: [] },
    socialLinks: {
      twitter: { type: String, default: '' },
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
    },
    contactEmail: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent re-compilation error in development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Settings;
}

const Settings: Model<ISettings> = mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);

export default Settings;
