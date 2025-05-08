const express = require("express");
const {
  getConversations,
  getConversationByJid,
  markConversationAsRead,
} = require("../controllers/conversation.controller");
// const { protect } = require("../middlewares/auth.middleware"); // Protection is applied at app level for these routes

const router = express.Router();

// All routes in this file are assumed to be protected by middleware in app.js
router.get("/", getConversations);
router.get("/:jid", getConversationByJid);
router.put("/:jid/read", markConversationAsRead);

module.exports = router;

