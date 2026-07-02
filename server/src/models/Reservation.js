import mongoose from 'mongoose';
import { RESERVATION_STATUS, TIME_SLOTS } from '../config/constants.js';

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: true,
    },
    // Stored as a normalized date-only string "YYYY-MM-DD" to avoid timezone
    // ambiguity around slot conflicts. The day is what matters, not the instant.
    date: {
      type: String,
      required: [true, 'Reservation date is required'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'],
      enum: {
        values: TIME_SLOTS,
        message: 'Invalid time slot',
      },
    },
    guests: {
      type: Number,
      required: [true, 'Number of guests is required'],
      min: [1, 'At least 1 guest is required'],
    },
    status: {
      type: String,
      enum: Object.values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.CONFIRMED,
      index: true,
    },
  },
  { timestamps: true }
);

/**
 * Race-condition-proof double-booking guard.
 *
 * A PARTIAL UNIQUE INDEX enforces at the database level that a given table can have at
 * most one CONFIRMED reservation for a specific (date, timeSlot). Two concurrent
 * requests that both pass the application-level availability check will still collide
 * here, and the second write fails with a duplicate-key error (handled gracefully by
 * the controller). Cancelled reservations are excluded, so a slot frees up on cancel.
 */
reservationSchema.index(
  { table: 1, date: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: RESERVATION_STATUS.CONFIRMED },
    name: 'uniq_confirmed_table_slot',
  }
);

// Common admin query: reservations on a given date.
reservationSchema.index({ date: 1, status: 1 });

export const Reservation = mongoose.model('Reservation', reservationSchema);
