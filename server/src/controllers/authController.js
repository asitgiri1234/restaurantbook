import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';
import { ROLES } from '../config/constants.js';

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

/**
 * POST /api/auth/register
 * Public. Always creates a CUSTOMER account — role cannot be self-assigned.
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, role: ROLES.CUSTOMER });
  const token = signToken({ id: user._id, role: user.role });

  res.status(201).json({ success: true, token, user: toPublicUser(user) });
});

/**
 * POST /api/auth/login
 * Public. Verifies credentials and returns a JWT.
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken({ id: user._id, role: user.role });
  res.json({ success: true, token, user: toPublicUser(user) });
});

/**
 * GET /api/auth/me
 * Protected. Returns the current authenticated user (used by the client on load).
 */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, user: toPublicUser(req.user) });
});
