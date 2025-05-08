const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    indexed: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  messageId: { // WhatsApp message ID (e.g., Baileys key.id)
    type: String,
    required: true,
    unique: true,
    indexed: true,
  },
  jid: { // JID of the other party in the conversation (contact or group)
    type: String,
    required: true,
    indexed: true,
  },
  senderJid: { // Actual sender JID (could be a group participant)
    type: String,
    required: true,
    indexed: true,
  },
  recipientJid: { // Actual recipient JID (could be the bot or a group)
    type: String,
    required: true,
    indexed: true,
  },
  fromMe: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["text", "image", "audio", "video", "document", "sticker", "location", "reaction", "revoked", "unknown"],
    default: "unknown",
  },
  content: {
    type: Object, // Flexible structure based on message type
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    indexed: true,
  },
  status: { // For outgoing messages
    type: String,
    enum: ["pending", "sent", "delivered", "read", "error"],
  },
  quotedMessageId: {
    type: String, // ID of the message being replied to
  },
  isAutoReply: {
    type: Boolean,
    default: false,
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
messageSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure `updatedAt` is updated on `findOneAndUpdate` and similar operations
messageSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

