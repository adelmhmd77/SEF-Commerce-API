
require('dotenv').config(); // must be first

const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const connectDB = require('./DB/connection');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();

// ---- Stripe webhook (Phase 4) ----
// The webhook route needs the RAW body, so it MUST be mounted
// BEFORE express.json() below.

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health route
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'SEF Commerce API is running' });
});

// ==================== MOUNT ROUTES HERE ====================
// Example: app.use('/api/auth', require('./routes/auth.routes'));
// ===========================================================

app.use(notFound);      // 404 handler
app.use(errorHandler);  // must be last

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

start();

module.exports = app; // useful for Vercel / testing