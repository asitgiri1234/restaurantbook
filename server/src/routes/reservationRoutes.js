import { Router } from 'express';
import {
  getSlots,
  getAvailability,
  createReservation,
  getMyReservations,
  cancelReservation,
  getAllReservations,
  updateReservation,
} from '../controllers/reservationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createReservationSchema,
  updateReservationSchema,
  availabilityQuerySchema,
  reservationsByDateQuerySchema,
} from '../validators/schemas.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Public-ish (list of configured slots) — still behind auth for consistency.
router.get('/slots', protect, getSlots);
router.get('/availability', protect, validateQuery(availabilityQuerySchema), getAvailability);

// Customer
router.post('/', protect, validateBody(createReservationSchema), createReservation);
router.get('/me', protect, getMyReservations);
router.delete('/:id', protect, cancelReservation); // ownership enforced in controller

// Admin
router.get(
  '/',
  protect,
  authorize(ROLES.ADMIN),
  validateQuery(reservationsByDateQuerySchema),
  getAllReservations
);
router.patch(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  validateBody(updateReservationSchema),
  updateReservation
);

export default router;
