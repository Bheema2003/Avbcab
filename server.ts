import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import 'dotenv/config';

const app = express();
const PORT = 3000;

app.use(express.json());

// Path to JSON databases
const DATA_DIR = path.join(process.cwd(), 'data_store');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

// Ensure data_store directory exists and initialize files
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const initJsonFile = (filePath: string, defaultData: any) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
};

initJsonFile(USERS_FILE, []);
initJsonFile(BOOKINGS_FILE, []);
initJsonFile(REVIEWS_FILE, []);

// Database reading/writing helpers
const readUsers = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeUsers = (users: any[]) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
};

const readBookings = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(BOOKINGS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeBookings = (bookings: any[]) => {
  fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
};

const readReviews = (): any[] => {
  try {
    return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
  } catch (e) {
    return [];
  }
};

const writeReviews = (reviews: any[]) => {
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
};

// Admin Credentials setting (default if not defined in env)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'avbcabz';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Bheema21@=#';
const ADMIN_TOKEN = 'avb-admin-super-secure-token-2026';

// --- API ROUTES ---

// Sync local data back to server (for durability across restarts/republishes)
app.post('/api/sync', (req, res) => {
  const { bookings, users } = req.body;

  try {
    if (Array.isArray(bookings)) {
      const currentBookings = readBookings();
      const bookingMap = new Map(currentBookings.map(b => [b.id, b]));
      bookings.forEach(b => {
        if (b && b.id) {
          bookingMap.set(b.id, { ...(bookingMap.get(b.id) || {}), ...b });
        }
      });
      writeBookings(Array.from(bookingMap.values()));
    }

    if (Array.isArray(users)) {
      const currentUsers = readUsers();
      const userMap = new Map(currentUsers.map(u => [u.id, u]));
      users.forEach(u => {
        if (u && u.id) {
          userMap.set(u.id, { ...(userMap.get(u.id) || {}), ...u });
        }
      });
      writeUsers(Array.from(userMap.values()));
    }

    res.json({ success: true, bookings: readBookings(), users: readUsers() });
  } catch (error) {
    console.error('Failed to sync server with local backup:', error);
    res.status(500).json({ error: 'Failed to sync with backup database.' });
  }
});

// Customer Authentication - SignUp
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, contact } = req.body;
  if (!name || !email || !password || !contact) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const users = readUsers();
  const normalizedEmail = email.toLowerCase().trim();

  const userExists = users.find(u => u.email === normalizedEmail);
  if (userExists) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const newUser = {
    id: 'USR-' + Math.floor(100000 + Math.random() * 900000),
    name,
    email: normalizedEmail,
    password, // Stored directly since it is a sandboxed training applet, but separated on server-side
    contact,
    role: 'customer',
    createdAt: new Date().toISOString()
  };

  users.push(newUser);
  writeUsers(users);

  // Return user without password
  const { password: _, ...userSafe } = newUser;
  res.status(201).json({ success: true, user: userSafe });
});

// Customer Authentication - Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const users = readUsers();
  const normalizedEmail = email.toLowerCase().trim();

  const user = users.find(u => u.email === normalizedEmail && u.password === password);
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

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.status(401).json({ error: 'Invalid admin credentials.' });
  }
});

// Create a Booking (Customers)
app.post('/api/bookings', (req, res) => {
  const { userId, bookingDetails } = req.body;
  if (!userId || !bookingDetails) {
    return res.status(400).json({ error: 'User ID and booking details are required.' });
  }

  // Validate user exists
  const users = readUsers();
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized user. Account not found.' });
  }

  const bookings = readBookings();
  const newBooking = {
    ...bookingDetails,
    id: bookingDetails.id || 'AVB-' + Math.floor(100000 + Math.random() * 900000),
    userId,
    status: 'Pending',
    createdAt: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  };

  bookings.unshift(newBooking);
  writeBookings(bookings);

  res.status(210).json({ success: true, booking: newBooking });
});

// Get My Bookings (Customers)
app.get('/api/bookings/my', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const bookings = readBookings();
  const myBookings = bookings.filter(b => b.userId === userId);
  res.json({ success: true, bookings: myBookings });
});

// Cancel a Booking (Customers)
app.put('/api/bookings/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  const bookings = readBookings();
  const index = bookings.findIndex(b => b.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (bookings[index].userId !== userId) {
    return res.status(403).json({ error: 'Unauthorized ownership.' });
  }

  bookings[index].status = 'Cancelled';
  writeBookings(bookings);

  res.json({ success: true, booking: bookings[index] });
});

// Get All Bookings (Admin)
app.get('/api/admin/bookings', (req, res) => {
  const token = req.headers.authorization;
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized. Access Denied.' });
  }

  const bookings = readBookings();
  // We can attach user details to bookings if we want
  const users = readUsers();
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
app.put('/api/admin/bookings/:id/status', (req, res) => {
  const token = req.headers.authorization;
  if (token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Unauthorized. Access Denied.' });
  }

  const { id } = req.params;
  const { status } = req.body;

  const allowedStatuses = ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  const bookings = readBookings();
  const index = bookings.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  bookings[index].status = status;
  writeBookings(bookings);

  res.json({ success: true, booking: bookings[index] });
});

// GET Reviews
app.get('/api/reviews', (req, res) => {
  const reviews = readReviews();
  res.json({ success: true, reviews });
});

// POST Review
app.post('/api/reviews', (req, res) => {
  const { name, rating, comment } = req.body;
  if (!name || !rating || !comment) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const reviews = readReviews();
  const newReview = {
    id: 'REV-' + Math.floor(100000 + Math.random() * 900000),
    name,
    rating: Number(rating),
    comment,
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  };

  reviews.unshift(newReview);
  writeReviews(reviews);

  res.status(201).json({ success: true, review: newReview });
});

// --- VITE MIDDLEWARE SETUP ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
