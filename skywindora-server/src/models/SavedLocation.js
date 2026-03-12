import mongoose from "mongoose";

const SavedLocationSchema = new mongoose.Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["city", "aviation"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    query: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One saved location per device per query
SavedLocationSchema.index({ deviceId: 1, query: 1 }, { unique: true });

export default mongoose.model("SavedLocation", SavedLocationSchema);