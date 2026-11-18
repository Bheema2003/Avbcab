import mongoose from 'mongoose';

// Ensure Mongoose fails fast when MongoDB is unreachable in containerized environments
mongoose.set('bufferCommands', false);

// Connect to MongoDB Atlas if MONGODB_URI is provided
let isConnected = false;
let authFailed = false;
let hasLoggedFallback = false;
let lastFailureAt = 0;
let connectionPromise: Promise<boolean> | null = null;
let errorListenerAttached = false;

const RETRY_COOLDOWN_MS = 60_000;

export const connectDB = async (): Promise<boolean> => {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    if (!hasLoggedFallback) {
      hasLoggedFallback = true;
      console.log('MongoDB: No MONGODB_URI provided. Using local JSON storage.');
    }
    return false;
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return true;
  }

  if (authFailed) {
    return false;
  }

  if (lastFailureAt && Date.now() - lastFailureAt < RETRY_COOLDOWN_MS) {
    return false;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  if (!errorListenerAttached) {
    errorListenerAttached = true;
    mongoose.connection.on('error', () => {
      isConnected = false;
    });
    mongoose.connection.on('disconnected', () => {
      isConnected = false;
    });
  }

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      isConnected = true;
      console.log('MongoDB: Connected to MongoDB Atlas.');
      return true;
    } catch (error: any) {
      isConnected = false;
      lastFailureAt = Date.now();
      const message = String(error?.message || '');
      if (
        error?.code === 8000 ||
        /bad auth|authentication failed|auth failed/i.test(message)
      ) {
        authFailed = true;
      }
      await mongoose.disconnect().catch(() => {});
      if (!hasLoggedFallback) {
        hasLoggedFallback = true;
        console.log('MongoDB unavailable; using local JSON storage fallback.');
      }
      return false;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
};

// --- MONGODB SCHEMAS & MODELS ---

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contact: { type: String, required: true },
  role: { type: String, default: 'customer' },
  createdAt: { type: String, required: true }
});

const BookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true },
  status: { type: String, default: 'Pending' },
  createdAt: { type: String, required: true }
}, { strict: false }); // strict: false allows any arbitrary booking fields (like pickup, drop, distance, etc.)

const ReviewSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  rating: { type: Number, required: true },
  comment: { type: String, required: true },
  date: { type: String, required: true }
});

// Use existing models if defined to prevent OverwriteModelError in serverless environments
export const MongoUser = (mongoose.models.User || mongoose.model('User', UserSchema)) as any;
export const MongoBooking = (mongoose.models.Booking || mongoose.model('Booking', BookingSchema)) as any;
export const MongoReview = (mongoose.models.Review || mongoose.model('Review', ReviewSchema)) as any;
