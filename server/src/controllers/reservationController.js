import { Reservation } from '../models/Reservation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { RESERVATION_STATUS, TIME_SLOTS } from '../config/constants.js';
import {
  assertTableBookable,
  getAvailableTables,
} from '../services/availabilityService.js';

const POPULATE = [
  { path: 'table', select: 'name capacity location' },
  { path: 'user', select: 'name email' },
];

/** GET /api/reservations/slots — public list of configured time slots. */
export const getSlots = asyncHandler(async (req, res) => {
  res.json({ success: true, slots: TIME_SLOTS });
});

/**
 * GET /api/reservations/availability?date=&timeSlot=&guests=
 * Authenticated. Returns tables and their availability for a slot.
 */
export const getAvailability = asyncHandler(async (req, res) => {
  const { date, timeSlot, guests } = req.validatedQuery;
  const tables = await getAvailableTables(date, timeSlot, { guests });
  res.json({ success: true, date, timeSlot, tables });
});

/**
 * POST /api/reservations
 * Customer. Creates a reservation after validating capacity + availability.
 */
export const createReservation = asyncHandler(async (req, res) => {
  const { tableId, date, timeSlot, guests } = req.body;

  await assertTableBookable({ tableId, date, timeSlot, guests }, ApiError);

  // The partial unique index is the final safety net against concurrent double-booking.
  const reservation = await Reservation.create({
    user: req.user._id,
    table: tableId,
    date,
    timeSlot,
    guests,
    status: RESERVATION_STATUS.CONFIRMED,
  });

  await reservation.populate(POPULATE);
  res.status(201).json({ success: true, reservation });
});

/** GET /api/reservations/me — Customer's own reservations (newest first). */
export const getMyReservations = asyncHandler(async (req, res) => {
  const reservations = await Reservation.find({ user: req.user._id })
    .sort({ date: -1, timeSlot: 1 })
    .populate(POPULATE);
  res.json({ success: true, count: reservations.length, reservations });
});

/**
 * DELETE /api/reservations/:id — Cancel a reservation.
 * Customers may only cancel their own; admins may cancel any.
 */
export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw ApiError.notFound('Reservation not found');

  const isOwner = String(reservation.user) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw ApiError.forbidden('You can only cancel your own reservations');
  }

  if (reservation.status === RESERVATION_STATUS.CANCELLED) {
    throw ApiError.badRequest('Reservation is already cancelled');
  }

  reservation.status = RESERVATION_STATUS.CANCELLED;
  await reservation.save();
  await reservation.populate(POPULATE);

  res.json({ success: true, reservation });
});

/* --------------------------- Admin-only handlers --------------------------- */

/**
 * GET /api/reservations?date=&status=
 * Admin. Lists all reservations, optionally filtered by date and/or status.
 */
export const getAllReservations = asyncHandler(async (req, res) => {
  const { date, status } = req.validatedQuery;
  const filter = {};
  if (date) filter.date = date;
  if (status) filter.status = status;

  const reservations = await Reservation.find(filter)
    .sort({ date: -1, timeSlot: 1 })
    .populate(POPULATE);

  res.json({ success: true, count: reservations.length, reservations });
});

/**
 * PATCH /api/reservations/:id
 * Admin. Updates any reservation (table, date, slot, guests) with full re-validation.
 */
export const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw ApiError.notFound('Reservation not found');

  if (reservation.status === RESERVATION_STATUS.CANCELLED) {
    throw ApiError.badRequest('Cannot update a cancelled reservation');
  }

  // Merge requested changes with current values, then re-validate the whole booking.
  const next = {
    tableId: req.body.tableId ?? String(reservation.table),
    date: req.body.date ?? reservation.date,
    timeSlot: req.body.timeSlot ?? reservation.timeSlot,
    guests: req.body.guests ?? reservation.guests,
  };

  await assertTableBookable(
    { ...next, excludeReservationId: reservation._id },
    ApiError
  );

  reservation.table = next.tableId;
  reservation.date = next.date;
  reservation.timeSlot = next.timeSlot;
  reservation.guests = next.guests;
  await reservation.save();
  await reservation.populate(POPULATE);

  res.json({ success: true, reservation });
});
