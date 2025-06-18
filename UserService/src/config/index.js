/*
 * src/config/index.js
 * Configuration settings centralized here.
 */
require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/user-service',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
};

module.exports = config;