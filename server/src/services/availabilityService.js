import { Table } from '../models/Table.js';
import { Reservation } from '../models/Reservation.js';
import { RESERVATION_STATUS } from '../config/constants.js';

/**
 * Returns the set of table ids that already have a CONFIRMED reservation for the given
 * (date, timeSlot). Optionally ignores one reservation (used when an admin edits an
 * existing reservation, so it isn't counted as a conflict with itself).
 */
export async function getBookedTableIds(date, timeSlot, { excludeReservationId } = {}) {
  const query = {
    date,
    timeSlot,
    status: RESERVATION_STATUS.CONFIRMED,
  };
  if (excludeReservationId) {
    query._id = { $ne: excludeReservationId };
  }
  const booked = await Reservation.find(query).select('table').lean();
  return new Set(booked.map((r) => String(r.table)));
}

/**
 * Computes which active tables are available for a (date, timeSlot), annotating each
 * with whether it can seat `guests`. If `guests` is provided, only tables with enough
 * capacity are returned as available.
 */
export async function getAvailableTables(date, timeSlot, { guests } = {}) {
  const tables = await Table.find({ isActive: true }).sort({ capacity: 1, name: 1 }).lean();
  const bookedIds = await getBookedTableIds(date, timeSlot);

  return tables
    .map((t) => {
      const isBooked = bookedIds.has(String(t._id));
      const fitsCapacity = guests == null || t.capacity >= guests;
      return {
        id: t._id,
        name: t.name,
        capacity: t.capacity,
        location: t.location,
        available: !isBooked && fitsCapacity,
        reason: isBooked
          ? 'Already booked for this slot'
          : !fitsCapacity
            ? 'Not enough capacity'
            : null,
      };
    })
    .filter((t) => (guests == null ? true : t.capacity >= guests || t.available));
}

/**
 * Validates that a specific table can be booked for (date, timeSlot, guests) and
 * returns the table document. Throws a friendly error via the provided factory.
 *
 * Note: this is the APPLICATION-level guard (nice error messages). The DATABASE-level
 * partial unique index on the Reservation model is the ultimate authority against
 * race conditions.
 */
export async function assertTableBookable(
  { tableId, date, timeSlot, guests, excludeReservationId },
  ApiError
) {
  const table = await Table.findById(tableId);
  if (!table || !table.isActive) {
    throw ApiError.notFound('Selected table does not exist or is not available');
  }

  if (table.capacity < guests) {
    throw ApiError.badRequest(
      `Table ${table.name} seats ${table.capacity}, but ${guests} guest(s) were requested`
    );
  }

  const conflict = await Reservation.findOne({
    table: tableId,
    date,
    timeSlot,
    status: RESERVATION_STATUS.CONFIRMED,
    ...(excludeReservationId ? { _id: { $ne: excludeReservationId } } : {}),
  }).lean();

  if (conflict) {
    throw ApiError.conflict(
      `Table ${table.name} is already booked for ${date} (${timeSlot})`
    );
  }

  return table;
}
