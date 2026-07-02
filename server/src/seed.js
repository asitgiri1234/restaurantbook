import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import { User } from './models/User.js';
import { Table } from './models/Table.js';
import { ROLES } from './config/constants.js';

/**
 * Seeds the database with:
 *   - A single admin account (credentials from env)
 *   - A fixed set of restaurant tables with varied capacities
 *
 * Idempotent: uses upserts so re-running does not create duplicates.
 * Run with: `npm run seed`
 */
const TABLES = [
  { name: 'T1', capacity: 2, location: 'Window' },
  { name: 'T2', capacity: 2, location: 'Window' },
  { name: 'T3', capacity: 4, location: 'Main hall' },
  { name: 'T4', capacity: 4, location: 'Main hall' },
  { name: 'T5', capacity: 4, location: 'Patio' },
  { name: 'T6', capacity: 6, location: 'Main hall' },
  { name: 'T7', capacity: 6, location: 'Patio' },
  { name: 'T8', capacity: 8, location: 'Private room' },
];

async function seed() {
  await connectDB(process.env.MONGO_URI);

  // --- Admin ---
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@restaurantbook.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'Admin';

  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword, // hashed by the pre-save hook
      role: ROLES.ADMIN,
    });
    console.log(`👤 Created admin: ${adminEmail}`);
  } else {
    console.log(`👤 Admin already exists: ${adminEmail}`);
  }

  // --- Tables ---
  for (const t of TABLES) {
    await Table.updateOne({ name: t.name }, { $setOnInsert: t }, { upsert: true });
  }
  const count = await Table.countDocuments();
  console.log(`🍽️  Tables ready (${count} total)`);

  await mongoose.disconnect();
  console.log('✅ Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
