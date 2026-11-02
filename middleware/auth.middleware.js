const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check that the Authorization header has the correct format:
    // Bearer <token>
    const tokenMatch = authHeader?.match(/^Bearer\s+(\S+)$/);

    if (!tokenMatch) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    const token = tokenMatch[1];

    // Verify the token and decode its payload.
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Load the user without returning the password.
    const currentUser = await User.findById(decoded.id).select('-password');

    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    // Attach the authenticated user to the request.
    req.user = currentUser;

    next();
  } catch (error) {
    // Handle expired JWT tokens clearly.
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    // Handle invalid or malformed JWT tokens clearly.
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }

    // Pass unexpected errors to the global error handler.
    next(error);
  }
};