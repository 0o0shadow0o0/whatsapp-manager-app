const Message = require("../../models/message.model");
const Conversation = require("../../models/conversation.model"); // For updating conversation on new message
const logger = require("../../utils/logger");
const whatsappService = require("../../services/whatsapp.service"); // For sending messages
const { updateOrCreateConversation } = require("./conversation.controller"); // To update conversation metadata

// @desc    Get messages for a specific conversation (JID)
// @route   GET /api/v1/messages/:jid
// @access  Protected
const getMessagesByJid = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const sortOrder = req.query.sort === "asc" ? 1 : -1;
    const skip = (page - 1) * limit;

    // First, find the conversation to get its ID
    const conversation = await Conversation.findOne({
      adminId: req.admin._id,
      jid: req.params.jid,
    });

    if (!conversation) {
      // If no conversation, there are no messages for this JID for this admin
      // Or, the JID itself is invalid / not yet interacted with.
      return res.json({ messages: [], totalPages: 0, currentPage: page });
      // return res.status(404).json({ error: "Conversation not found for this JID." });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ timestamp: sortOrder })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments({ conversationId: conversation._id });

    res.json({
      messages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error(`Error getting messages for JID ${req.params.jid}:`, error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Send a new message
// @route   POST /api/v1/messages/send
// @access  Protected
const sendMessageController = async (req, res) => {
  const { jid, type, content } = req.body;

  if (!jid || !type || !content) {
    return res.status(400).json({ error: "Missing required fields: jid, type, content" });
  }

  // Basic validation for text message type
  if (type === "text" && (typeof content.text !== "string" || content.text.trim() === "")) {
    return res.status(400).json({ error: "Text content cannot be empty for text messages" });
  }

  try {
    // Construct the message content for Baileys
    let messagePayload;
    if (type === "text") {
      messagePayload = { text: content.text };
    } else {
      // TODO: Handle other message types (image, audio, video, document)
      // This would involve receiving files, potentially saving them, and constructing
      // the appropriate Baileys message object (e.g., { image: { url: ... } } or { document: ... })
      return res.status(400).json({ error: `Message type '${type}' not yet supported for sending via API.` });
    }

    const sentBaileysMessage = await whatsappService.sendMessage(jid, messagePayload);

    if (!sentBaileysMessage || !sentBaileysMessage.key || !sentBaileysMessage.key.id) {
        logger.error("Failed to send message via Baileys or received unexpected response:", sentBaileysMessage);
        return res.status(500).json({ error: "Failed to send message through WhatsApp service." });
    }

    // After successful sending via Baileys, save to our DB
    // Ensure conversation exists or create it
    const conversation = await updateOrCreateConversation(req.admin._id, jid, sentBaileysMessage, true);
    if (!conversation) {
        logger.error(`Failed to update or create conversation for JID ${jid} after sending message.`);
        // Continue to save the message but log this issue
    }

    const newMessage = new Message({
      conversationId: conversation._id, // Link to our conversation document
      adminId: req.admin._id,
      messageId: sentBaileysMessage.key.id, // Baileys message ID
      jid: jid, // Recipient JID
      senderJid: sentBaileysMessage.key.participant || req.admin.whatsappId, // Sender is admin/bot
      recipientJid: jid,
      fromMe: true,
      type: type, // Assuming type matches Baileys type or is mapped
      content: content, // The content sent by the user
      timestamp: new Date(sentBaileysMessage.messageTimestamp ? parseInt(sentBaileysMessage.messageTimestamp) * 1000 : Date.now()),
      status: "sent", // Initial status, Baileys will send updates
    });

    await newMessage.save();

    // The whatsapp.service.js should emit a "new_message" socket event upon successful send.
    // If not, we can emit it here, but it's better centralized in the service.
    // const io = req.app.get("io");
    // if (io) {
    //   io.emit("new_message", { message: newMessage, conversationJid: jid });
    // }

    res.status(201).json({ message: newMessage });

  } catch (error) {
    logger.error(`Error sending message to ${jid}:`, error);
    if (error.message === "WhatsApp not connected") {
        return res.status(503).json({ error: "WhatsApp service not available. Please connect first." });
    }
    res.status(500).json({ error: "Server error while sending message" });
  }
};

// This function would be called by whatsapp.service.js when a new message is received from Baileys
const saveReceivedMessage = async (adminId, baileysMessage) => {
    try {
        const remoteJid = baileysMessage.key.remoteJid;
        const conversation = await updateOrCreateConversation(adminId, remoteJid, baileysMessage, baileysMessage.key.fromMe);
        if (!conversation) {
            logger.error(`Failed to update or create conversation for JID ${remoteJid} for received message.`);
            return null;
        }

        let messageType = "unknown";
        let messageContent = {};

        if (baileysMessage.message?.conversation) {
            messageType = "text";
            messageContent = { text: baileysMessage.message.conversation };
        } else if (baileysMessage.message?.extendedTextMessage?.text) {
            messageType = "text";
            messageContent = { text: baileysMessage.message.extendedTextMessage.text };
        } else if (baileysMessage.message?.imageMessage) {
            messageType = "image";
            messageContent = {
                caption: baileysMessage.message.imageMessage.caption,
                mimetype: baileysMessage.message.imageMessage.mimetype,
                // url: directUrl (if available and downloaded), or placeholder
                // TODO: Handle media download and storage
            };
        } // Add more types as needed (video, audio, document, sticker, location)
        else if (baileysMessage.message?.reactionMessage) {
            messageType = "reaction";
            messageContent = {
                text: baileysMessage.message.reactionMessage.text,
                key: baileysMessage.message.reactionMessage.key
            };
        } else if (baileysMessage.message?.protocolMessage?.type === "REVOKE") {
            messageType = "revoked";
            messageContent = { revokedMsgId: baileysMessage.message.protocolMessage.key?.id };
            // TODO: Handle message revocation in DB (e.g., mark original message as revoked)
        }

        const newMessage = new Message({
            conversationId: conversation._id,
            adminId: adminId,
            messageId: baileysMessage.key.id,
            jid: remoteJid,
            senderJid: baileysMessage.key.participant || baileysMessage.key.remoteJid, // participant for groups
            recipientJid: baileysMessage.key.fromMe ? baileysMessage.key.remoteJid : (await Admin.findById(adminId)).whatsappId, // Assuming admin has a whatsappId field
            fromMe: baileysMessage.key.fromMe,
            type: messageType,
            content: messageContent,
            timestamp: new Date(parseInt(baileysMessage.messageTimestamp) * 1000),
            status: baileysMessage.key.fromMe ? "sent" : "delivered", // Or "read" if app logic handles it
            quotedMessageId: baileysMessage.message?.extendedTextMessage?.contextInfo?.quotedMessage?.key?.id || baileysMessage.message?.imageMessage?.contextInfo?.quotedMessage?.key?.id, // Example for text/image
        });

        await newMessage.save();
        logger.info(`Received message ${newMessage.messageId} from ${remoteJid} saved to DB.`);
        return newMessage;
    } catch (error) {
        logger.error("Error saving received message:", error);
        throw error;
    }
};

module.exports = {
  getMessagesByJid,
  sendMessageController,
  saveReceivedMessage, // Export for use in whatsapp.service.js
};

