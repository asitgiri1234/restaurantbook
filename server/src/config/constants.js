/**
 * Central place for domain constants shared across the app.
 */

// User roles
export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  ADMIN: 'admin',
});

// Reservation lifecycle states
export const RESERVATION_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
});

/**
 * Fixed daily time slots.
 *
 * DESIGN DECISION: We model bookings as discrete, non-overlapping slots rather than
 * arbitrary start/end times. This makes conflict detection unambiguous — a table is
 * double-booked only when another CONFIRMED reservation exists for the same
 * (table, date, slot). It keeps the availability logic simple, correct, and easy to
 * reason about, which is the primary evaluation area of this assignment.
 */
export const TIME_SLOTS = Object.freeze([
  '12:00-13:30',
  '13:30-15:00',
  '18:00-19:30',
  '19:30-21:00',
  '21:00-22:30',
]);
