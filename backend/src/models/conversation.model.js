const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  jid: { // WhatsApp JID (user or group)
    type: String,
    required: true,
    unique: true, // Unique per admin, or globally? For now, assume globally unique for simplicity in a single-admin context.
    // If multi-admin in future, this might need to be unique per adminId + jid combination.
    indexed: true,
  },
  name: {
    type: String,
    trim: true,
  },
  unreadCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastMessageTimestamp: {
    type: Date,
    indexed: true,
  },
  lastMessageSnippet: {
    type: String,
    trim: true,
    maxlength: 100, // Keep snippets short
  },
  archived: {
    type: Boolean,
    default: false,
  },
  pinned: {
    type: Boolean,
    default: false,
  },
  mutedUntil: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update `updatedAt` field before saving
conversationSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure `updatedAt` is updated on `findOneAndUpdate` and similar operations
conversationSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Conversation = mongoose.model("Conversation", conversationSchema);

module.exports = Conversation;

