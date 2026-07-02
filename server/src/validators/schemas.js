import { z } from 'zod';
import { TIME_SLOTS } from '../config/constants.js';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const createReservationSchema = z.object({
  tableId: z.string().min(1, 'Table is required'),
  date: dateString,
  timeSlot: z.enum(TIME_SLOTS, { errorMap: () => ({ message: 'Invalid time slot' }) }),
  guests: z.coerce.number().int().min(1, 'At least 1 guest is required'),
});

// Admin update — all fields optional; at least one must be present.
export const updateReservationSchema = z
  .object({
    tableId: z.string().min(1).optional(),
    date: dateString.optional(),
    timeSlot: z.enum(TIME_SLOTS).optional(),
    guests: z.coerce.number().int().min(1).optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Provide at least one field to update',
  });

export const availabilityQuerySchema = z.object({
  date: dateString,
  timeSlot: z.enum(TIME_SLOTS, { errorMap: () => ({ message: 'Invalid time slot' }) }),
  guests: z.coerce.number().int().min(1).optional(),
});

export const tableSchema = z.object({
  name: z.string().trim().min(1, 'Table name is required'),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1'),
  location: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

export const updateTableSchema = tableSchema.partial().refine(
  (obj) => Object.keys(obj).length > 0,
  { message: 'Provide at least one field to update' }
);

export const reservationsByDateQuerySchema = z.object({
  date: dateString.optional(),
  status: z.enum(['confirmed', 'cancelled']).optional(),
});
