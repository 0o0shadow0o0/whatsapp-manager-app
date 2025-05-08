const { makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const path = require("path");
const pino = require("pino");
const qrcodeTerminal = require("qrcode-terminal");
const config = require("../config");
const logger = require("../utils/logger");
const WhatsAppSession = require("../models/whatsappSession.model");
const Admin = require("../models/admin.model");
// Import other necessary models and services (e.g., for saving messages, conversations)

let sock = null;
let globalIO = null; // To store the io instance from server.js

const SESSIONS_DIR = path.join(__dirname, "..", "..", "whatsapp_sessions");

const getSession = async (sessionId) => {
  // For single admin, sessionId is fixed (e.g., "default_session")
  // In a multi-admin setup, this would fetch based on the logged-in admin or a specific session ID.
  const admin = await Admin.findOne({ username: config.adminUsername.toLowerCase() });
  if (!admin) {
    logger.error("Default admin not found for session management.");
    return null;
  }
  let session = await WhatsAppSession.findOne({ adminId: admin._id, sessionId: sessionId });
  if (!session) {
    session = await WhatsAppSession.create({
      adminId: admin._id,
      sessionId: sessionId,
      sessionData: { creds: {}, keys: {} }, // Initial empty auth state structure
      status: "initializing",
    });
    logger.info(`New session record created for sessionId: ${sessionId}`);
  }
  return session;
};

const saveSession = async (sessionId, sessionData) => {
  const admin = await Admin.findOne({ username: config.adminUsername.toLowerCase() });
  if (!admin) return;
  await WhatsAppSession.findOneAndUpdate(
    { adminId: admin._id, sessionId: sessionId },
    { sessionData: sessionData, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  logger.debug(`Session data saved for sessionId: ${sessionId}`);
};

const initializeWhatsAppService = async (ioInstance) => {
  globalIO = ioInstance; // Store io instance for global use within this service

  logger.info("Initializing WhatsApp Service...");

  const { state, saveCreds } = await useMultiFileAuthState(path.join(SESSIONS_DIR, config.sessionConfigId));

  const startSocket = async () => {
    const { version, isLatest } = await fetchLatestBaileysVersion();
    logger.info(`Using Baileys version: ${version.join(".")}, isLatest: ${isLatest}`);

    sock = makeWASocket({
      version,
      logger: pino({ level: config.logLevel === "trace" || config.logLevel === "debug" ? "debug" : "silent" }), // Use pino logger, only debug/trace for baileys
      printQRInTerminal: true, // For initial testing, will be replaced by QR to frontend
      auth: state,
      browser: [config.botName, "Chrome", "10.0"],
      // implement other features like storing messages, etc.
      // getMessage: async key => {
      // 	return {
      // 		conversation: "hello"
      // 	}
      // }
    });

    // QR Code Handling
    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;
      let sessionRecord = await getSession(config.sessionConfigId);

      if (qr) {
        logger.info("QR code generated. Broadcasting to frontend...");
        qrcodeTerminal.generate(qr, { small: true }); // Log to terminal for now
        if (globalIO) {
          globalIO.emit("whatsapp_qr_updated", { qrCode: qr });
        }
        if (sessionRecord) {
          sessionRecord.status = "pending_qr";
          await sessionRecord.save();
          if (globalIO) globalIO.emit("whatsapp_status_update", { status: "pending_qr" });
        }
      }

      if (connection === "close") {
        const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
        logger.warn(`Connection closed due to: ${lastDisconnect.error}, reconnecting: ${shouldReconnect}`);
        if (sessionRecord) {
          sessionRecord.status = "disconnected";
          await sessionRecord.save();
          if (globalIO) globalIO.emit("whatsapp_status_update", { status: "disconnected", message: lastDisconnect.error?.message });
        }
        if (shouldReconnect) {
          startSocket();
        } else {
          logger.error("Logged out. Please scan QR code again.");
          // Optionally clear session data here if logged out permanently
          // await clearSessionData(config.sessionConfigId);
        }
      }

      if (connection === "open") {
        logger.info("WhatsApp connection opened successfully.");
        if (sessionRecord) {
          sessionRecord.status = "connected";
          sessionRecord.linkedPhoneNumber = sock.user?.id?.split(":")[0]; // Extract phone number
          sessionRecord.lastConnectedAt = new Date();
          await sessionRecord.save();
          if (globalIO) globalIO.emit("whatsapp_status_update", { status: "connected", phoneNumber: sessionRecord.linkedPhoneNumber });
        }
      }
    });

    // Save credentials on update
    sock.ev.on("creds.update", saveCreds);

    // Handle incoming messages
    sock.ev.on("messages.upsert", async (m) => {
      logger.info("Received messages.upsert event:", JSON.stringify(m, undefined, 2));
      // m.messages contains the new messages
      // m.type === "notify" means it is a new message
      if (m.type === "notify" && m.messages.length > 0) {
        for (const msg of m.messages) {
          if (!msg.key.fromMe) { // Example: only process incoming messages
            logger.info(`New message from: ${msg.key.remoteJid}, content: ${JSON.stringify(msg.message)}`);
            // TODO: Save message to DB (messages collection)
            // TODO: Update conversation in DB (conversations collection)
            // TODO: Check for auto-reply triggers (auto_replies collection)
            // TODO: Emit new_message event to frontend via Socket.IO
            if (globalIO) {
              globalIO.emit("new_message", {
                message: msg, // Send the raw Baileys message object for now
                conversationJid: msg.key.remoteJid,
              });
            }
          }
        }
      }
    });

    // Handle message status updates (sent, delivered, read)
    sock.ev.on("messages.update", (updates) => {
      logger.info("Received messages.update event:", JSON.stringify(updates, undefined, 2));
      for (const update of updates) {
        // update contains { key, update: { status } }
        // TODO: Update message status in DB
        // TODO: Emit message_update event to frontend via Socket.IO
        if (globalIO) {
          globalIO.emit("message_update", {
            messageId: update.key.id,
            status: update.update.status,
            conversationJid: update.key.remoteJid,
          });
        }
      }
    });

    // Other event listeners (presence, contacts, chats, etc.) can be added here
    // sock.ev.on("presence.update", (json) => logger.debug("Presence Update:", json));
    // sock.ev.on("contacts.upsert", (contacts) => logger.debug("Contacts Upsert:", contacts));
    // sock.ev.on("chats.upsert", (newChats) => logger.debug("Chats Upsert:", newChats));

  };

  await startSocket();
  logger.info("WhatsApp Service (Baileys) started.");
};

const sendMessage = async (jid, messageContent) => {
  if (!sock || sock.ws.readyState !== sock.ws.OPEN) {
    logger.error("WhatsApp socket not connected. Cannot send message.");
    throw new Error("WhatsApp not connected");
  }
  try {
    // Example for text message
    // For other types (image, video, document), the content structure will be different
    // Refer to Baileys documentation for sending different message types.
    const sentMsg = await sock.sendMessage(jid, messageContent);
    logger.info(`Message sent to ${jid}:`, sentMsg);
    // TODO: Save sent message to DB
    // TODO: Emit new_message event to frontend for the sent message
    if (globalIO && sentMsg) {
        globalIO.emit("new_message", {
            message: sentMsg, // Send the raw Baileys message object for now
            conversationJid: jid,
        });
    }
    return sentMsg;
  } catch (error) {
    logger.error(`Error sending message to ${jid}:`, error);
    throw error;
  }
};

const getWhatsAppSocket = () => sock;

module.exports = {
  initializeWhatsAppService,
  sendMessage,
  getWhatsAppSocket,
  // Add other exported functions like getStatus, disconnect, etc.
};

