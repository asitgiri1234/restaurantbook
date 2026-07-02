import mongoose from 'mongoose';

/**
 * Establish a connection to MongoDB.
 * Fails fast (exits the process) if the connection cannot be established,
 * so the app is never running in a half-broken state.
 */
export async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGO_URI is not defined. Check your environment variables.');
  }

  mongoose.set('strictQuery', true);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
}
