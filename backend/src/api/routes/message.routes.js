const express = require("express");
const {
  getMessagesByJid,
  sendMessageController,
} = require("../controllers/message.controller");
// const { protect } = require("../middlewares/auth.middleware"); // Protection is applied at app level

const router = express.Router();

// All routes in this file are assumed to be protected by middleware in app.js
router.get("/:jid", getMessagesByJid);
router.post("/send", sendMessageController);

module.exports = router;

