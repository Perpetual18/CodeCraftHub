/*
 * src/controllers/userController.js
 * Handles HTTP requests and responses.
 */
const UserService = require('../services/userService');

class UserController {
  static async register(req, res, next) {
    try {
      const user = await UserService.registerUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await UserService.authenticateUser(email, password);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user.userId);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const updatedUser = await UserService.updateUser(req.user.userId, req.body);
      res.json(updatedUser);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;