const mongoose = require("mongoose");

const whatsappSessionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true,
  },
  sessionId: {
    type: String,
    required: true,
    unique: true,
    default: "default_session", // As per design for single admin
  },
  sessionData: {
    type: Object, // Stores Baileys auth state
    required: true,
    default: {},
  },
  linkedPhoneNumber: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ["pending_qr", "connected", "disconnected", "error", "initializing"],
    default: "initializing",
  },
  lastConnectedAt: {
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
whatsappSessionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Ensure `updatedAt` is updated on `findOneAndUpdate` and similar operations
whatsappSessionSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const WhatsAppSession = mongoose.model("WhatsAppSession", whatsappSessionSchema);

module.exports = WhatsAppSession;

