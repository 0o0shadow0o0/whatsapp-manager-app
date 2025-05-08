const jwt = require("jsonwebtoken");
const config = require("../config");

const generateToken = (adminId, username) => {
  const payload = {
    id: adminId,
    username: username,
  };
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};

