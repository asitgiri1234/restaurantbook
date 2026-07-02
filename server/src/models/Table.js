import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema(
  {
    // Human-friendly table identifier, e.g. "T1", unique per restaurant.
    name: {
      type: String,
      required: [true, 'Table name is required'],
      unique: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Table capacity is required'],
      min: [1, 'Capacity must be at least 1'],
    },
    // Optional descriptor (e.g. "Window", "Patio").
    location: {
      type: String,
      trim: true,
      default: 'Main hall',
    },
    // Soft toggle so admins can take a table out of service without deleting it.
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Table = mongoose.model('Table', tableSchema);
