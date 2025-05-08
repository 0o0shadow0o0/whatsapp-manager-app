const logger = require("../../utils/logger");
const whatsappService = require("../../services/whatsapp.service");
const WhatsAppSession = require("../../models/whatsappSession.model");
const config = require("../../config");

// @desc    Get WhatsApp session status
// @route   GET /api/v1/whatsapp/session/status
// @access  Protected
const getSessionStatus = async (req, res) => {
  try {
    // In a single admin setup, we fetch the default session
    const session = await WhatsAppSession.findOne({ adminId: req.admin._id, sessionId: config.sessionConfigId });
    if (!session) {
      return res.status(404).json({ status: "not_found", message: "Session not initialized." });
    }
    // The actual connection status might also be maintained in whatsapp.service.js or emitted via socket
    // This DB status is a persisted record.
    res.json({ status: session.status, phoneNumber: session.linkedPhoneNumber });
  } catch (error) {
    logger.error("Error getting session status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Request QR code for linking (initiates process, QR sent via WebSocket)
// @route   GET /api/v1/whatsapp/session/qr
// @access  Protected
const getQrCode = async (req, res) => {
  try {
    // The actual QR generation is handled by Baileys in whatsapp.service.js
    // and emitted via Socket.IO. This endpoint can confirm the process is active
    // or trigger a re-initiation if needed.
    const sock = whatsappService.getWhatsAppSocket();
    if (sock && sock.ws?.readyState === sock.ws?.OPEN && sock.user) {
        return res.json({ message: "Already connected. No QR needed.", status: "connected" });
    }
    // If not connected, the whatsapp.service should be attempting to connect and emit QR.
    // We can check the persisted status.
    const session = await WhatsAppSession.findOne({ adminId: req.admin._id, sessionId: config.sessionConfigId });
    if (session && session.status === "pending_qr") {
        res.json({ message: "QR code generation is in progress. Check WebSocket for QR data.", status: "pending_qr" });
    } else if (session && session.status === "connected") {
        res.json({ message: "Already connected.", status: "connected" });
    } else {
        // Potentially trigger a re-connection attempt if the service is idle and disconnected
        // For now, assume the service handles its reconnections.
        // await whatsappService.initializeWhatsAppService(req.app.get("io")); // This might be too aggressive here
        res.json({ message: "QR code process is active or will be initiated. Listen on WebSockets.", status: session ? session.status : "initializing" });
    }

  } catch (error) {
    logger.error("Error in QR code request process:", error);
    res.status(500).json({ error: "Server error during QR request" });
  }
};

// @desc    Initiate WhatsApp connection (if not auto-started)
// @route   POST /api/v1/whatsapp/session/connect
// @access  Protected
const connectSession = async (req, res) => {
  try {
    // The service initializes on server start. This could be a manual trigger if needed.
    // For now, this endpoint might be more for future use or specific re-connection scenarios.
    // await whatsappService.initializeWhatsAppService(req.app.get("io")); // Potentially re-initialize
    logger.info("Manual connection attempt triggered for WhatsApp session.");
    res.json({ message: "Connection process is managed by the service. Check status for updates." });
  } catch (error) {
    logger.error("Error initiating WhatsApp connection:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Disconnect WhatsApp session
// @route   POST /api/v1/whatsapp/session/disconnect
// @access  Protected
const disconnectSession = async (req, res) => {
  try {
    const sock = whatsappService.getWhatsAppSocket();
    if (sock) {
      await sock.logout(); // Baileys logout
      // The connection.update event in whatsapp.service will handle status updates
      logger.info("WhatsApp session disconnect requested.");
      res.json({ message: "Disconnect process initiated. Session will close." });
    } else {
      res.status(404).json({ message: "No active WhatsApp session to disconnect." });
    }
  } catch (error) {
    logger.error("Error disconnecting WhatsApp session:", error);
    res.status(500).json({ error: "Server error during disconnect" });
  }
};

module.exports = {
  getSessionStatus,
  getQrCode,
  connectSession,
  disconnectSession,
};

