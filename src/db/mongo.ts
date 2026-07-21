import mongoose from 'mongoose';

// Connect to MongoDB Atlas if MONGODB_URI is provided
let isConnected = false;

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('MongoDB: No MONGODB_URI provided. Falling back to local JSON files.');
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log('MongoDB: Successfully connected to MongoDB Atlas!');
    return true;
  } catch (error) {
    console.error('MongoDB: Connection failed:', error);
    return false;
  }
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
