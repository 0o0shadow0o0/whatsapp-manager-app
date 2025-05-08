const mongoose = require("mongoose");

const autoReplySchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  keyword: {
    type: String,
    required: true,
    trim: true,
    indexed: true,
  },
  replyMessage: {
    type: String,
    required: true,
    trim: true,
  },
  matchType: {
    type: String,
    enum: ["exact", "contains", "startsWith", "regex"],
    default: "contains",
    required: true,
  },
  caseSensitive: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
    indexed: true,
  },
  priority: {
    type: Number,
    default: 0, // Lower number means higher priority
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
autoReplySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure `updatedAt` is updated on `findOneAndUpdate` and similar operations
autoReplySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const AutoReply = mongoose.model("AutoReply", autoReplySchema);

module.exports = AutoReply;

