/*
 * src/middlewares/errorMiddleware.js
 * Centralized error handling middleware.
 */
const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(err);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({ message });
};