const express = require("express");
const {
  loginAdmin,
  getMe,
  logoutAdmin,
} = require("../controllers/auth.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/me", protect, getMe);
router.post("/logout", protect, logoutAdmin); // Optional, as JWT is stateless

module.exports = router;

