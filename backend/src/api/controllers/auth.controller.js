const Admin = require("../../models/admin.model");
const { generateToken } = require("../../utils/jwt.utils");
const config = require("../../config");
const logger = require("../../utils/logger");

// @desc    Authenticate admin & get token
// @route   POST /api/v1/auth/login
// @access  Public
const loginAdmin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Please provide username and password" });
  }

  try {
    const admin = await Admin.findOne({ username: username.toLowerCase() });

    if (admin && (await admin.comparePassword(password))) {
      const token = generateToken(admin._id, admin.username);
      res.json({
        token,
        admin: {
          id: admin._id,
          username: admin.username,
        },
      });
    } else {
      res.status(401).json({ error: "Invalid username or password" });
    }
  } catch (error) {
    logger.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

// @desc    Get current logged-in admin details
// @route   GET /api/v1/auth/me
// @access  Protected
const getMe = async (req, res) => {
  // req.admin is attached by the protect middleware
  if (req.admin) {
    res.json({
      admin: {
        id: req.admin._id,
        username: req.admin.username,
      },
    });
  } else {
    // This case should ideally be caught by the protect middleware itself
    res.status(401).json({ error: "Not authorized, admin details not found" });
  }
};

// @desc    Logout admin (Placeholder, JWT is stateless)
// @route   POST /api/v1/auth/logout
// @access  Protected
const logoutAdmin = async (req, res) => {
  // For stateless JWT, client-side token removal is typical.
  // If using a token blacklist, implement that logic here.
  res.json({ message: "Logout successful. Please clear your token on the client-side." });
};

// This is a helper function that might be run once on initial setup
// or through a protected admin route if dynamic admin creation is needed later.
// For now, we assume one admin as per user clarification.
const createInitialAdmin = async () => {
  try {
    const adminExists = await Admin.findOne({ username: config.adminUsername.toLowerCase() });
    if (!adminExists) {
      await Admin.create({
        username: config.adminUsername.toLowerCase(),
        password: config.adminPassword,
      });
      logger.info(`Initial admin user '${config.adminUsername}' created.`);
    } else {
      logger.info(`Initial admin user '${config.adminUsername}' already exists.`);
    }
  } catch (error) {
    logger.error("Error creating initial admin user:", error);
  }
};

module.exports = {
  loginAdmin,
  getMe,
  logoutAdmin,
  createInitialAdmin,
};

