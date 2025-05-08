const { verifyToken } = require("../../utils/jwt.utils");
const Admin = require("../../models/admin.model");
const logger = require("../../utils/logger");

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ error: "Not authorized, token failed" });
      }

      // Attach admin to request object
      req.admin = await Admin.findById(decoded.id).select("-password");

      if (!req.admin) {
        return res.status(401).json({ error: "Not authorized, admin not found" });
      }

      next();
    } catch (error) {
      logger.error("Authentication error:", error);
      return res.status(401).json({ error: "Not authorized, token failed" });
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Not authorized, no token" });
  }
};

module.exports = { protect };

