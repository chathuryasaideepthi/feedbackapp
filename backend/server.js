require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const storesRoutes = require('./routes/stores');
const ratingsRoutes = require('./routes/ratings');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// API Routes
app.use('/api/auth', authRoutes);          // Authentication routes
app.use('/api/admin', adminRoutes);        // Admin CRUD & dashboard
app.use('/api/stores', storesRoutes);      // Store routes (list, add, edit, delete)
app.use('/api/ratings', ratingsRoutes);    // Ratings routes

// 404 handler
app.use((req, res) => {
  res.status(404).json({ msg: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ msg: 'Server error', error: err.message });
});

// Connect to DB and start server
const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });
