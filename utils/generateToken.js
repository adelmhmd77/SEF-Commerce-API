const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE || '1d';

  if (!secret) {
    throw new Error('JWT_SECRET is missing in environment variables');
  }

  return jwt.sign({ id: userId, role }, secret, { expiresIn });
};

module.exports = generateToken;
