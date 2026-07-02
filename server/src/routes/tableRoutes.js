import { Router } from 'express';
import {
  getTables,
  createTable,
  updateTable,
  deleteTable,
} from '../controllers/tableController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { tableSchema, updateTableSchema } from '../validators/schemas.js';
import { ROLES } from '../config/constants.js';

const router = Router();

router.get('/', protect, getTables);
router.post('/', protect, authorize(ROLES.ADMIN), validateBody(tableSchema), createTable);
router.patch(
  '/:id',
  protect,
  authorize(ROLES.ADMIN),
  validateBody(updateTableSchema),
  updateTable
);
router.delete('/:id', protect, authorize(ROLES.ADMIN), deleteTable);

export default router;
