import mongoose, { Schema, model, models } from 'mongoose';

const SettingSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed, // Can be boolean, string, or object
      required: true,
    },
    updatedBy: {
        type: String // User ID or Name
    }
  },
  {
    timestamps: true,
  }
);

// Prevent overwrite during hot reload
const Setting = models.Setting || model('Setting', SettingSchema);

export default Setting;
