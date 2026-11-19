import express from 'express';
import path from 'path';
import fs from 'fs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const app = express();

export const isServerless = Boolean(
  process.env.NETLIFY ||
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.CONTEXT
);

app.use(express.json());

// Normalize Netlify / serverless function paths so all Express /api/* routes match consistently
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '') || '/';
  }
  if (isServerless && !req.url.startsWith('/api')) {
    req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
  }
  next();
});

// Path to JSON databases (used as durable local fallback when Atlas is unreachable)
const DATA_DIR = isServerless ? path.join('/tmp', 'data_store') : path.join(process.cwd(), 'data_store');
const SEED_DIR = path.join(process.cwd(), 'data_store');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');
const DELETED_BOOKINGS_FILE = path.join(DATA_DIR, 'deleted_bookings.json');

if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.warn('Could not create data directory:', err);
  }
}

const initJsonFile = (filePath: string, defaultData: any, seedFileName?: string) => {
  if (!fs.existsSync(filePath)) {
    let content = JSON.stringify(defaultData, null, 2);
    if (seedFileName) {
      const seedFile = path.join(SEED_DIR, seedFileName);
      if (fs.existsSync(seedFile)) {
        try {
          content = fs.readFileSync(seedFile, 'utf-8');
        } catch {}
      }
    }
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (err) {
      console.warn('Could not write JSON file:', filePath, err);
    }
  }
};

initJsonFile(USERS_FILE, [], 'users.json');
initJsonFile(BOOKINGS_FILE, [], 'bookings.json');
initJsonFile(REVIEWS_FILE, [], 'reviews.json');
initJsonFile(DELETED_BOOKINGS_FILE, []);

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

// Local JSON fallback helpers
const readUsersJson = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

const writeUsersJson = (users: any[]) => {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

const readBookingsJson = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

const writeBookingsJson = (bookings: any[]) => {
  ensureDataDir();
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
};

const readReviewsJson = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

const writeReviewsJson = (reviews: any[]) => {
  ensureDataDir();
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
};

const readDeletedBookingIdsJson = (): string[] => {
  try {
    const parsed = JSON.parse(fs.readFileSync(DELETED_BOOKINGS_FILE, 'utf-8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeDeletedBookingIdsJson = (ids: string[]) => {
  ensureDataDir();
  fs.writeFileSync(DELETED_BOOKINGS_FILE, JSON.stringify(Array.from(new Set(ids)), null, 2), 'utf-8');
};

// --- MONGODB ATLAS SETUP ---
const DEFAULT_MONGODB_URI =
  'mongodb+srv://Avbcab:Avbcab2026@cluster0.toqcf1c.mongodb.net/avbcabs?retryWrites=true&w=majority';
const MONGODB_URI = (process.env.MONGODB_URI || DEFAULT_MONGODB_URI).trim();

const userSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    contact: { type: String, required: true },
    role: { type: String, default: 'customer' },
    createdAt: { type: String }
  },
  { versionKey: false }
);

const bookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    serviceType: { type: String, required: true },
    name: { type: String, required: true },
    contact: { type: String, required: true },
    pickup: { type: String, required: true },
    drop: { type: String, default: '' },
    date: { type: String, required: true },
    time: { type: String, required: true },
    status: { type: String, default: 'Pending' },
    createdAt: { type: String },
    createdTs: { type: Number, default: () => Date.now() },
    updatedAt: { type: String },
    priceEstimate: { type: String },
    finalAmount: { type: String },
    completedAt: { type: String },
    driverName: { type: String },
    driverPhone: { type: String },
    vehicleDetails: { type: String },
    adminNotes: { type: String }
  },
  { versionKey: false }
);

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    date: { type: String },
    createdTs: { type: Number, default: () => Date.now() }
  },
  { versionKey: false }
);

const deletedBookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    deletedAt: { type: String }
  },
  { versionKey: false }
);

const UserModel: mongoose.Model<any> = mongoose.models.User || mongoose.model('User', userSchema);
const BookingModel: mongoose.Model<any> = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
const ReviewModel: mongoose.Model<any> = mongoose.models.Review || mongoose.model('Review', reviewSchema);
const DeletedBookingModel: mongoose.Model<any> =
  mongoose.models.DeletedBooking || mongoose.model('DeletedBooking', deletedBookingSchema);

const stripMongoMeta = <T extends Record<string, any>>(doc: T | null): T | null => {
  if (!doc) return null;
  const { _id, __v, ...rest } = doc;
  return rest as T;
};

let mongoConnectPromise: Promise<boolean> | null = null;
let lastMongoFailureAt = 0;
let lastMongoError: string | null = null;
let localSeedMigrated = false;
const MONGO_RETRY_COOLDOWN_MS = 15000;

const migrateLocalJsonToMongoOnce = async () => {
  if (localSeedMigrated || mongoose.connection.readyState !== 1) return;
  localSeedMigrated = true;
  try {
    const deletedIds = new Set(readDeletedBookingIdsJson());
    for (const delId of deletedIds) {
      await DeletedBookingModel.updateOne(
        { id: delId },
        { $setOnInsert: { id: delId, deletedAt: new Date().toISOString() } },
        { upsert: true }
      ).catch(() => {});
    }

    const localUsers = readUsersJson();
    for (const u of localUsers) {
      if (u?.id && u?.email) {
        const normalizedEmail = String(u.email).toLowerCase().trim();
        const exists = await UserModel.findOne({ $or: [{ id: u.id }, { email: normalizedEmail }] }).lean();
        if (!exists) {
          await UserModel.create({ ...u, email: normalizedEmail });
        }
      }
    }

    const localBookings = readBookingsJson();
    for (const b of localBookings) {
      if (b?.id && !deletedIds.has(b.id)) {
        const exists = await BookingModel.findOne({ id: b.id }).lean();
        if (!exists) {
          await BookingModel.create(b);
        }
      }
    }

    const localReviews = readReviewsJson();
    for (const r of localReviews) {
      if (r?.id) {
        const exists = await ReviewModel.findOne({ id: r.id }).lean();
        if (!exists) {
          await ReviewModel.create(r);
        }
      }
    }
  } catch (err) {
    console.warn('Local-to-Mongo migration warning:', err);
  }
};

const ensureMongoConnected = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (!MONGODB_URI) {
    lastMongoError = 'MONGODB_URI not configured';
    return false;
  }

  const now = Date.now();
  if (lastMongoFailureAt && now - lastMongoFailureAt < MONGO_RETRY_COOLDOWN_MS) {
    return false;
  }

  if (!mongoConnectPromise) {
    mongoConnectPromise = mongoose
      .connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      })
      .then(async () => {
        lastMongoError = null;
        lastMongoFailureAt = 0;
        console.log('MongoDB Atlas connected:', mongoose.connection.host);
        await migrateLocalJsonToMongoOnce();
        return true;
      })
      .catch((err: any) => {
        lastMongoFailureAt = Date.now();
        lastMongoError = err?.message || 'MongoDB connection failed';
        console.warn('MongoDB Atlas unavailable, using local JSON store:', lastMongoError);
        return false;
      })
      .finally(() => {
        mongoConnectPromise = null;
      });
  }

  return mongoConnectPromise;
};

// Trigger non-blocking connection on cold start in traditional server mode
if (!isServerless) {
  void ensureMongoConnected();
}

// Unified persistence helpers (MongoDB Atlas primary + local JSON fallback)
const readUsers = async (): Promise<any[]> => {
  if (await ensureMongoConnected()) {
    const docs = await UserModel.find({}).lean();
    return docs.map(d => stripMongoMeta(d)).filter(Boolean);
  }
  return readUsersJson();
};

const readBookings = async (): Promise<any[]> => {
  if (await ensureMongoConnected()) {
    const docs = await BookingModel.find({}).sort({ createdTs: -1, _id: -1 }).lean();
    return docs.map(d => stripMongoMeta(d)).filter(Boolean);
  }
  return readBookingsJson();
};

const readReviews = async (): Promise<any[]> => {
  if (await ensureMongoConnected()) {
    const docs = await ReviewModel.find({}).sort({ createdTs: -1, _id: -1 }).lean();
    return docs.map(d => stripMongoMeta(d)).filter(Boolean);
  }
  return readReviewsJson();
};

const readDeletedBookingIds = async (): Promise<string[]> => {
  if (await ensureMongoConnected()) {
    const docs = await DeletedBookingModel.find({}, { id: 1 }).lean();
    return docs.map((d: any) => d.id).filter(Boolean);
  }
  return readDeletedBookingIdsJson();
};

// Admin Credentials setting
const ADMIN_USERNAME = 'avbcabz';
const ADMIN_PASSWORD = 'avbcabz2026';
const ADMIN_TOKEN = 'avb-admin-super-secure-token-2026';

// --- API ROUTES ---

// Health & storage check
app.get('/api/health', async (req, res) => {
  const mongoConnected = await ensureMongoConnected();
  const clusterHost = MONGODB_URI.match(/@([^/?]+)/)?.[1] || 'unknown';
  res.json({
    ok: true,
    connected: true,
    storage: mongoConnected ? 'mongodb-atlas' : 'local-json',
    mongoConnected,
    mongoCluster: mongoose.connection.host || clusterHost,
    mongoError: mongoConnected ? null : lastMongoError,
    serverless: isServerless
  });
});

// Sync local data back to server (for durability across restarts/republishes)
app.post('/api/sync', async (req, res) => {
  const { bookings, users } = req.body;
  const mongoConnected = await ensureMongoConnected();

  try {
    const deletedIdsList = await readDeletedBookingIds();
    const deletedIdsSet = new Set(deletedIdsList);

    if (Array.isArray(bookings)) {
      if (mongoConnected) {
        const existingIds = new Set(
          (await BookingModel.find({}, { id: 1 }).lean()).map((b: any) => b.id)
        );
        for (const b of bookings) {
          if (b && b.id && !existingIds.has(b.id) && !deletedIdsSet.has(b.id)) {
            await BookingModel.create(b).catch(() => {});
            existingIds.add(b.id);
          }
        }
      } else {
        const currentBookings = readBookingsJson();
        const bookingMap = new Map(currentBookings.map(b => [b.id, b]));
        bookings.forEach(b => {
          if (b && b.id && !bookingMap.has(b.id) && !deletedIdsSet.has(b.id)) {
            bookingMap.set(b.id, b);
          }
        });
        writeBookingsJson(Array.from(bookingMap.values()));
      }
    }

    if (Array.isArray(users)) {
      if (mongoConnected) {
        const existingUsers = await UserModel.find({}, { id: 1, email: 1 }).lean();
        const idSet = new Set(existingUsers.map((u: any) => u.id));
        const emailSet = new Set(existingUsers.map((u: any) => String(u.email || '').toLowerCase().trim()));
        for (const u of users) {
          const normalizedEmail = String(u?.email || '').toLowerCase().trim();
          if (u && u.id && normalizedEmail && !idSet.has(u.id) && !emailSet.has(normalizedEmail)) {
            await UserModel.create({ ...u, email: normalizedEmail }).catch(() => {});
            idSet.add(u.id);
            emailSet.add(normalizedEmail);
          }
        }
      } else {
        const currentUsers = readUsersJson();
        const userMap = new Map(currentUsers.map(u => [u.id, u]));
        const emailSet = new Set(currentUsers.map(u => String(u.email || '').toLowerCase().trim()));
        users.forEach(u => {
          const normalizedEmail = String(u?.email || '').toLowerCase().trim();
          if (u && u.id && normalizedEmail && !userMap.has(u.id) && !emailSet.has(normalizedEmail)) {
            const cleanUser = { ...u, email: normalizedEmail };
            userMap.set(u.id, cleanUser);
            emailSet.add(normalizedEmail);
          }
        });
        writeUsersJson(Array.from(userMap.values()));
      }
    }

    const latestUsers = (await readUsers()).map(({ password: _, ...safe }) => safe);
    res.json({
      success: true,
      bookings: await readBookings(),
      users: latestUsers,
      deletedIds: deletedIdsList
    });
  } catch (error) {
    console.error('Failed to sync server with local backup:', error);
    res.status(500).json({ error: 'Failed to sync with backup database.' });
  }
});

// Customer Authentication - SignUp
app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, contact } = req.body;
  if (!name || !email || !password || !contact) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const mongoConnected = await ensureMongoConnected();

  if (mongoConnected) {
    const existing = await UserModel.findOne({ email: normalizedEmail }).lean();
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }
    const newUser = {
      id: 'USR-' + Math.floor(100000 + Math.random() * 900000),
      name,
      email: normalizedEmail,
      password,
      contact,
      role: 'customer',
      createdAt: new Date().toISOString()
    };
    await UserModel.create(newUser);
    const { password: _, ...userSafe } = newUser;
    return res.status(201).json({ success: true, user: userSafe });
  }

  const users = readUsersJson();
  const userExists = users.find(u => u.email === normalizedEmail);
  if (userExists) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: 'USR-' + Math.floor(100000 + Math.random() * 900000),
    name,
    email: normalizedEmail,
    password,
    contact,
    role: 'customer',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsersJson(users);

  const { password: _, ...userSafe } = newUser;
  res.status(201).json({ success: true, user: userSafe });
});

// Customer Authentication - Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password, durableUser } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const mongoConnected = await ensureMongoConnected();

  if (mongoConnected) {
    let user: any = stripMongoMeta(
      await UserModel.findOne({ email: normalizedEmail, password }).lean()
    );

    if (
      !user &&
      durableUser &&
      typeof durableUser.email === 'string' &&
      durableUser.email.toLowerCase().trim() === normalizedEmail &&
      durableUser.password === password &&
      durableUser.id
    ) {
      const emailTaken = await UserModel.findOne({ email: normalizedEmail }).lean();
      if (!emailTaken) {
        user = { ...durableUser, email: normalizedEmail };
        await UserModel.create(user);
      }
    }

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const { password: _, ...userSafe } = user;
    return res.json({ success: true, user: userSafe });
  }

  const users = readUsersJson();
  let user = users.find(u => u.email === normalizedEmail && u.password === password);

  if (
    !user &&
    durableUser &&
    typeof durableUser.email === 'string' &&
    durableUser.email.toLowerCase().trim() === normalizedEmail &&
    durableUser.password === password &&
    durableUser.id &&
    !users.some(u => u.email === normalizedEmail)
  ) {
    user = {
      ...durableUser,
      email: normalizedEmail
    };
    users.push(user);
    writeUsersJson(users);
  }

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const { password: _, ...userSafe } = user;
  res.json({ success: true, user: userSafe });
});

// Admin Authentication - Login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  if (String(username).trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials.' });
  }
});

// Create a Booking (Customers)
app.post('/api/bookings', async (req, res) => {
  const { userId, bookingDetails, userProfile } = req.body;
  if (!userId || !bookingDetails) {
    return res.status(400).json({ error: 'User ID and booking details are required.' });
  }

  const mongoConnected = await ensureMongoConnected();

  if (mongoConnected) {
    let user = await UserModel.findOne({ id: userId }).lean();
    if (!user && userProfile && userProfile.id === userId && userProfile.email) {
      const restored = {
        ...userProfile,
        email: String(userProfile.email).toLowerCase().trim(),
        role: 'customer',
        createdAt: userProfile.createdAt || new Date().toISOString()
      };
      await UserModel.updateOne({ id: userId }, { $setOnInsert: restored }, { upsert: true });
      user = restored;
    }
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized user. Account not found.' });
    }

    const newBooking = {
      ...bookingDetails,
      id: bookingDetails.id || 'AVB-' + Math.floor(100000 + Math.random() * 900000),
      userId,
      status: 'Pending',
      createdTs: Date.now(),
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    await BookingModel.create(newBooking);
    return res.status(201).json({ success: true, booking: newBooking });
  }

  const users = readUsersJson();
  let user = users.find(u => u.id === userId);
  if (!user && userProfile && userProfile.id === userId && userProfile.email) {
    user = {
      ...userProfile,
      email: String(userProfile.email).toLowerCase().trim(),
      role: 'customer',
      createdAt: userProfile.createdAt || new Date().toISOString()
    };
    users.push(user);
    writeUsersJson(users);
  }
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized user. Account not found.' });
  }

  const bookings = readBookingsJson();
  const newBooking = {
    ...bookingDetails,
    id: bookingDetails.id || 'AVB-' + Math.floor(100000 + Math.random() * 900000),
    userId,
    status: 'Pending',
    createdTs: Date.now(),
    createdAt: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  bookings.unshift(newBooking);
  writeBookingsJson(bookings);

  res.status(201).json({ success: true, booking: newBooking });
});

// Get My Bookings (Customers)
app.get('/api/bookings/my', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const deletedIds = await readDeletedBookingIds();

  if (await ensureMongoConnected()) {
    const docs = await BookingModel.find({ userId: String(userId) })
      .sort({ createdTs: -1, _id: -1 })
      .lean();
    return res.json({ success: true, bookings: docs.map(d => stripMongoMeta(d)), deletedIds });
  }

  const bookings = readBookingsJson();
  const myBookings = bookings.filter(b => b.userId === userId);
  res.json({ success: true, bookings: myBookings, deletedIds });
});

// Cancel a Booking (Customers)
app.put('/api/bookings/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  if (await ensureMongoConnected()) {
    const existing: any = await BookingModel.findOne({ id }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized ownership.' });
    }
    const updated = await BookingModel.findOneAndUpdate(
      { id },
      { $set: { status: 'Cancelled', updatedAt: new Date().toISOString() } },
      { new: true }
    ).lean();
    return res.json({ success: true, booking: stripMongoMeta(updated) });
  }

  const bookings = readBookingsJson();
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (bookings[index].userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized ownership.' });
  }

  bookings[index].status = 'Cancelled';
  bookings[index].updatedAt = new Date().toISOString();
  writeBookingsJson(bookings);

  res.json({ success: true, booking: bookings[index] });
});

// Get All Bookings (Admin)
app.get('/api/admin/bookings', async (req, res) => {
  const token = req.headers.authorization;
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized. Access Denied.' });
  }

  const bookings = await readBookings();
  const users = await readUsers();
  const enrichedBookings = bookings.map(booking => {
    const user = users.find(u => u.id === booking.userId);
    return {
      ...booking,
      customerDetails: user ? { name: user.name, email: user.email, contact: user.contact } : null
    };
  });

  res.json({ success: true, bookings: enrichedBookings });
});

// Update Booking Status (Admin)
app.put('/api/admin/bookings/:id/status', async (req, res) => {
  const token = req.headers.authorization;
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized. Access Denied.' });
  }

  const { id } = req.params;
  const { status, finalAmount } = req.body;

  const allowedStatuses = ['Pending', 'Confirmed', 'Driver Assigned', 'In Progress', 'Completed', 'Cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const cleanedAmount = finalAmount !== undefined ? String(finalAmount).replace(/,/g, '').trim() : undefined;

  if (await ensureMongoConnected()) {
    const existing: any = await BookingModel.findOne({ id }).lean();
    if (!existing) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const updateFields: Record<string, any> = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (status === 'Completed') {
      const effectiveAmount =
        cleanedAmount !== undefined
          ? cleanedAmount
          : String(existing.finalAmount || '').replace(/,/g, '').trim();
      const numericAmount = Number(effectiveAmount);
      if (!effectiveAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'Please enter amount before marking booking as Completed.' });
      }
      updateFields.finalAmount = effectiveAmount;
      updateFields.completedAt = existing.completedAt || new Date().toISOString();
    } else if (cleanedAmount !== undefined) {
      updateFields.finalAmount = cleanedAmount;
    }

    const updated = await BookingModel.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { new: true }
    ).lean();
    return res.json({ success: true, booking: stripMongoMeta(updated) });
  }

  const bookings = readBookingsJson();
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (status === 'Completed') {
    const effectiveAmount =
      cleanedAmount !== undefined
        ? cleanedAmount
        : String(bookings[index].finalAmount || '').replace(/,/g, '').trim();
    const numericAmount = Number(effectiveAmount);
    if (!effectiveAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Please enter amount before marking booking as Completed.' });
    }
    bookings[index].finalAmount = effectiveAmount;
    bookings[index].completedAt = bookings[index].completedAt || new Date().toISOString();
  } else if (cleanedAmount !== undefined) {
    bookings[index].finalAmount = cleanedAmount;
  }

  bookings[index].status = status;
  bookings[index].updatedAt = new Date().toISOString();
  writeBookingsJson(bookings);

  res.json({ success: true, booking: bookings[index] });
});

// Update Full Booking Details (Admin)
app.put('/api/admin/bookings/:id', async (req, res) => {
  const token = req.headers.authorization;
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized. Access Denied.' });
  }

  const { id } = req.params;
  const {
    name,
    contact,
    serviceType,
    pickup,
    drop,
    date,
    time,
    status,
    priceEstimate,
    finalAmount,
    driverName,
    driverPhone,
    vehicleDetails,
    adminNotes
  } = req.body;

  const allowedStatuses = ['Pending', 'Confirmed', 'Driver Assigned', 'In Progress', 'Completed', 'Cancelled'];
  if (status !== undefined && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  if (await ensureMongoConnected()) {
    const current: any = await BookingModel.findOne({ id }).lean();
    if (!current) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const nextStatus = status !== undefined ? status : current.status;
    const cleanedAmount =
      finalAmount !== undefined ? String(finalAmount).replace(/,/g, '').trim() : current.finalAmount;

    if (nextStatus === 'Completed') {
      const numericAmount = Number(String(cleanedAmount || '').replace(/,/g, '').trim());
      if (!cleanedAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ error: 'Please enter amount before marking booking as Completed.' });
      }
    }

    const updateFields: Record<string, any> = {
      ...(name !== undefined ? { name } : {}),
      ...(contact !== undefined ? { contact } : {}),
      ...(serviceType !== undefined ? { serviceType } : {}),
      ...(pickup !== undefined ? { pickup } : {}),
      ...(drop !== undefined ? { drop } : {}),
      ...(date !== undefined ? { date } : {}),
      ...(time !== undefined ? { time } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priceEstimate !== undefined ? { priceEstimate } : {}),
      ...(finalAmount !== undefined ? { finalAmount: cleanedAmount } : {}),
      ...(nextStatus === 'Completed' ? { completedAt: current.completedAt || new Date().toISOString() } : {}),
      ...(driverName !== undefined ? { driverName } : {}),
      ...(driverPhone !== undefined ? { driverPhone } : {}),
      ...(vehicleDetails !== undefined ? { vehicleDetails } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      updatedAt: new Date().toISOString()
    };

    const updated = await BookingModel.findOneAndUpdate(
      { id },
      { $set: updateFields },
      { new: true }
    ).lean();
    return res.json({ success: true, booking: stripMongoMeta(updated) });
  }

  const bookings = readBookingsJson();
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const current = bookings[index];
  const nextStatus = status !== undefined ? status : current.status;
  const cleanedAmount = finalAmount !== undefined ? String(finalAmount).replace(/,/g, '').trim() : current.finalAmount;

  if (nextStatus === 'Completed') {
    const numericAmount = Number(String(cleanedAmount || '').replace(/,/g, '').trim());
    if (!cleanedAmount || Number.isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: 'Please enter amount before marking booking as Completed.' });
    }
  }

  bookings[index] = {
    ...current,
    ...(name !== undefined ? { name } : {}),
    ...(contact !== undefined ? { contact } : {}),
    ...(serviceType !== undefined ? { serviceType } : {}),
    ...(pickup !== undefined ? { pickup } : {}),
    ...(drop !== undefined ? { drop } : {}),
    ...(date !== undefined ? { date } : {}),
    ...(time !== undefined ? { time } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(priceEstimate !== undefined ? { priceEstimate } : {}),
    ...(finalAmount !== undefined ? { finalAmount: cleanedAmount } : {}),
    ...(nextStatus === 'Completed' ? { completedAt: current.completedAt || new Date().toISOString() } : {}),
    ...(driverName !== undefined ? { driverName } : {}),
    ...(driverPhone !== undefined ? { driverPhone } : {}),
    ...(vehicleDetails !== undefined ? { vehicleDetails } : {}),
    ...(adminNotes !== undefined ? { adminNotes } : {}),
    updatedAt: new Date().toISOString()
  };

  writeBookingsJson(bookings);

  res.json({ success: true, booking: bookings[index] });
});

// Delete a Booking (Admin)
app.delete('/api/admin/bookings/:id', async (req, res) => {
  const token = req.headers.authorization;
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized. Access Denied.' });
  }

  const { id } = req.params;

  if (await ensureMongoConnected()) {
    const deleted = await BookingModel.findOneAndDelete({ id }).lean();
    if (!deleted) {
      return res.status(404).json({ error: 'Booking not found.' });
    }
    await DeletedBookingModel.updateOne(
      { id },
      { $setOnInsert: { id, deletedAt: new Date().toISOString() } },
      { upsert: true }
    ).catch(() => {});

    // Keep local fallback clean as well when running locally
    if (!isServerless) {
      const localBookings = readBookingsJson().filter(b => b.id !== id);
      writeBookingsJson(localBookings);
      const localDeleted = readDeletedBookingIdsJson();
      localDeleted.push(id);
      writeDeletedBookingIdsJson(localDeleted);
    }

    return res.json({ success: true, deletedId: id });
  }

  const bookings = readBookingsJson();
  const exists = bookings.some(b => b.id === id);
  if (!exists) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const updated = bookings.filter(b => b.id !== id);
  writeBookingsJson(updated);

  const deletedIds = readDeletedBookingIdsJson();
  deletedIds.push(id);
  writeDeletedBookingIdsJson(deletedIds);

  res.json({ success: true, deletedId: id });
});

// GET Reviews
app.get('/api/reviews', async (req, res) => {
  const reviews = await readReviews();
  res.json({ success: true, reviews });
});

// POST Review
app.post('/api/reviews', async (req, res) => {
  const { name, rating, comment } = req.body;
  if (!name || !rating || !comment) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const newReview = {
    id: 'REV-' + Math.floor(100000 + Math.random() * 900000),
    name,
    rating: Number(rating),
    comment,
    createdTs: Date.now(),
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  };

  if (await ensureMongoConnected()) {
    await ReviewModel.create(newReview);
    return res.status(201).json({ success: true, review: newReview });
  }

  const reviews = readReviewsJson();
  reviews.unshift(newReview);
  writeReviewsJson(reviews);

  res.status(201).json({ success: true, review: newReview });
});

// Database error handling middleware for graceful fallback in sandboxed environments
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    err?.name === 'MongooseError' ||
    err?.name === 'MongoNetworkError' ||
    (typeof err?.message === 'string' && err.message.includes('buffering timed out'))
  ) {
    console.warn('[AI Studio] Database offline — returning mock/fallback response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

export { app };
export default app;
