/*
 * src/services/userService.js
 * Business logic for user operations.
 */
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const config = require('../config');

class UserService {
  /**
   * Registers a new user.
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} - Created user without password
   */
  static async registerUser(userData) {
    const { username, email, password, role } = userData;

    // Check if email or username already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const err = new Error('Email or username already in use');
      err.statusCode = 409;
      throw err;
    }

    const user = new User({ username, email, password, role });
    await user.save();

    // Remove password before returning
    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  /**
   * Authenticates user credentials and returns JWT token.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<Object>} - Object containing token and user info
   */
  static async authenticateUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    const payload = { userId: user._id, role: user.role };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

    const userObj = user.toObject();
    delete userObj.password;

    return { token, user: userObj };
  }

  /**
   * Retrieves user profile by ID.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  static async getUserById(userId) {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }
    return user;
  }

  /**
   * Updates user profile.
   * @param {string} userId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  static async updateUser(userId, updateData) {
    if (updateData.password) {
      // Password will be hashed by mongoose pre-save hook
    }
    updateData.updatedAt = new Date();

    const user = await User.findById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    Object.assign(user, updateData);
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }
}

module.exports = UserService;
