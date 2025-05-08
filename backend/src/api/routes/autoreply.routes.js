const express = require("express");
const {
  getAutoReplies,
  createAutoReply,
  getAutoReplyById,
  updateAutoReply,
  deleteAutoReply,
} = require("../controllers/autoreply.controller");
// const { protect } = require("../middlewares/auth.middleware"); // Protection is applied at app level

const router = express.Router();

// All routes in this file are assumed to be protected by middleware in app.js
router.route("/").get(getAutoReplies).post(createAutoReply);
router
  .route("/:id")
  .get(getAutoReplyById)
  .put(updateAutoReply)
  .delete(deleteAutoReply);

module.exports = router;

