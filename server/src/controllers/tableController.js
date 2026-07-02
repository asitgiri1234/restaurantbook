import { Table } from '../models/Table.js';
import { Reservation } from '../models/Reservation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { RESERVATION_STATUS } from '../config/constants.js';

/** GET /api/tables — Authenticated. Lists active tables (all tables for admins). */
export const getTables = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { isActive: true };
  const tables = await Table.find(filter).sort({ name: 1 });
  res.json({ success: true, count: tables.length, tables });
});

/** POST /api/tables — Admin. Creates a table. */
export const createTable = asyncHandler(async (req, res) => {
  const exists = await Table.findOne({ name: req.body.name });
  if (exists) throw ApiError.conflict(`Table "${req.body.name}" already exists`);

  const table = await Table.create(req.body);
  res.status(201).json({ success: true, table });
});

/** PATCH /api/tables/:id — Admin. Updates a table. */
export const updateTable = asyncHandler(async (req, res) => {
  const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!table) throw ApiError.notFound('Table not found');
  res.json({ success: true, table });
});

/**
 * DELETE /api/tables/:id — Admin.
 * Refuses to delete a table that has upcoming confirmed reservations to protect data
 * integrity; suggests deactivating instead.
 */
export const deleteTable = asyncHandler(async (req, res) => {
  const activeBookings = await Reservation.countDocuments({
    table: req.params.id,
    status: RESERVATION_STATUS.CONFIRMED,
  });
  if (activeBookings > 0) {
    throw ApiError.conflict(
      'Table has confirmed reservations. Deactivate it instead of deleting.'
    );
  }

  const table = await Table.findByIdAndDelete(req.params.id);
  if (!table) throw ApiError.notFound('Table not found');
  res.json({ success: true, message: 'Table deleted' });
});
