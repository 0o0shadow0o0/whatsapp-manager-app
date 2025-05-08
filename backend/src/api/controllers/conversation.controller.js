const Conversation = require("../../models/conversation.model");
const Message = require("../../models/message.model"); // Needed for lastMessageSnippet updates potentially
const logger = require("../../utils/logger");
const config = require("../../config");

// @desc    Get all conversations for the admin
// @route   GET /api/v1/conversations
// @access  Protected
const getConversations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({ adminId: req.admin._id })
      .sort({ lastMessageTimestamp: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalConversations = await Conversation.countDocuments({ adminId: req.admin._id });

    res.json({
      conversations,
      totalPages: Math.ceil(totalConversations / limit),
      currentPage: page,
    });
  } catch (error) {
    logger.error("Error getting conversations:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get a specific conversation by JID
// @route   GET /api/v1/conversations/:jid
// @access  Protected
const getConversationByJid = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      adminId: req.admin._id,
      jid: req.params.jid,
    });

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    res.json({ conversation });
  } catch (error) {
    logger.error(`Error getting conversation ${req.params.jid}:`, error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Mark a conversation as read (updates unreadCount)
// @route   PUT /api/v1/conversations/:jid/read
// @access  Protected
const markConversationAsRead = async (req, res) => {
  try {
    const conversation = await Conversation.findOneAndUpdate(
      { adminId: req.admin._id, jid: req.params.jid },
      { unreadCount: 0, updatedAt: new Date() }, // Reset unread count and update timestamp
      { new: true } // Return the updated document
    );

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Optionally, emit a socket event to notify frontend of the update
    const io = req.app.get("io");
    if (io) {
      io.emit("conversation_update", { conversation });
    }

    res.json({ message: "Conversation marked as read.", conversation });
  } catch (error) {
    logger.error(`Error marking conversation ${req.params.jid} as read:`, error);
    res.status(500).json({ error: "Server error" });
  }
};

// Helper function (used internally by whatsapp.service.js, not an API endpoint itself usually)
// This function would be called when a new message arrives or is sent.
const updateOrCreateConversation = async (adminId, jid, message, fromMe) => {
  try {
    let conversation = await Conversation.findOne({ adminId, jid });
    const messageTimestamp = new Date(message.messageTimestamp ? message.messageTimestamp * 1000 : Date.now());
    let messageSnippet = "";

    if (message.message?.conversation) {
      messageSnippet = message.message.conversation;
    } else if (message.message?.extendedTextMessage?.text) {
      messageSnippet = message.message.extendedTextMessage.text;
    } else if (message.message?.imageMessage?.caption) {
      messageSnippet = message.message.imageMessage.caption || "[Image]";
    } else if (Object.keys(message.message || {}).length > 0) {
        // Fallback for other message types
        const firstKey = Object.keys(message.message)[0];
        messageSnippet = `[${firstKey.replace("Message", "") || "Media"}]`;
    }
    messageSnippet = messageSnippet.substring(0,100); // Ensure snippet is not too long


    if (conversation) {
      conversation.lastMessageTimestamp = messageTimestamp;
      conversation.lastMessageSnippet = messageSnippet;
      if (!fromMe) { // Only increment unread count for incoming messages
        conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      }
      conversation.updatedAt = new Date();
    } else {
      // Attempt to get contact name (this might be complex and better handled by contact sync)
      // For now, use JID or a placeholder if name is not readily available
      let contactName = jid.split("@")[0]; // Basic name from JID
      // if (sock && sock.contacts && sock.contacts[jid]) {
      //   contactName = sock.contacts[jid].name || sock.contacts[jid].notify || contactName;
      // }

      conversation = new Conversation({
        adminId,
        jid,
        name: contactName, // This name might need to be updated later via contact sync
        lastMessageTimestamp: messageTimestamp,
        lastMessageSnippet: messageSnippet,
        unreadCount: fromMe ? 0 : 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    await conversation.save();
    logger.info(`Conversation for JID ${jid} updated/created.`);

    // Emit conversation update via Socket.IO
    // This requires access to the `io` instance. It might be better to do this from where this function is called (e.g., whatsapp.service)
    // if (globalIO) { // Assuming globalIO is accessible
    //   globalIO.emit("conversation_update", { conversation });
    // }

    return conversation;
  } catch (error) {
    logger.error(`Error updating or creating conversation for JID ${jid}:`, error);
    throw error; // Re-throw to be handled by caller
  }
};


module.exports = {
  getConversations,
  getConversationByJid,
  markConversationAsRead,
  updateOrCreateConversation, // Exporting for use in whatsapp.service.js
};

