const express = require("express");
const {
  getSessionStatus,
  getQrCode,
  connectSession,
  disconnectSession,
} = require("../controllers/whatsapp.controller");
const { protect } = require("../middlewares/auth.middleware");

const router = express.Router();

// All routes in this file are protected by the protect middleware applied in app.js
router.get("/session/status", getSessionStatus);
router.get("/session/qr", getQrCode);
router.post("/session/connect", connectSession);
router.post("/session/disconnect", disconnectSession);

module.exports = router;

