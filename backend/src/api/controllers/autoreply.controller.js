const AutoReply = require("../../models/autoReply.model");
const logger = require("../../utils/logger");
const whatsappService = require("../../services/whatsapp.service"); // For sending auto-replies

// @desc    Get all auto-reply rules for the admin
// @route   GET /api/v1/autoreplies
// @access  Protected
const getAutoReplies = async (req, res) => {
  try {
    const autoReplies = await AutoReply.find({ adminId: req.admin._id }).sort({ priority: 1, createdAt: -1 });
    res.json({ autoReplies });
  } catch (error) {
    logger.error("Error getting auto-replies:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Create a new auto-reply rule
// @route   POST /api/v1/autoreplies
// @access  Protected
const createAutoReply = async (req, res) => {
  const { keyword, replyMessage, matchType, caseSensitive, enabled, priority } = req.body;

  if (!keyword || !replyMessage) {
    return res.status(400).json({ error: "Keyword and reply message are required" });
  }

  try {
    const newAutoReply = new AutoReply({
      adminId: req.admin._id,
      keyword,
      replyMessage,
      matchType,
      caseSensitive,
      enabled,
      priority,
    });
    await newAutoReply.save();
    res.status(201).json({ autoReply: newAutoReply });
  } catch (error) {
    logger.error("Error creating auto-reply:", error);
    if (error.code === 11000) { // Duplicate key error
        return res.status(400).json({ error: "An auto-reply with similar identifying fields might already exist." });
    }
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Get a specific auto-reply rule by ID
// @route   GET /api/v1/autoreplies/:id
// @access  Protected
const getAutoReplyById = async (req, res) => {
  try {
    const autoReply = await AutoReply.findOne({ _id: req.params.id, adminId: req.admin._id });
    if (!autoReply) {
      return res.status(404).json({ error: "Auto-reply rule not found" });
    }
    res.json({ autoReply });
  } catch (error) {
    logger.error(`Error getting auto-reply ${req.params.id}:`, error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Update an existing auto-reply rule
// @route   PUT /api/v1/autoreplies/:id
// @access  Protected
const updateAutoReply = async (req, res) => {
  const { keyword, replyMessage, matchType, caseSensitive, enabled, priority } = req.body;
  try {
    const autoReply = await AutoReply.findOne({ _id: req.params.id, adminId: req.admin._id });

    if (!autoReply) {
      return res.status(404).json({ error: "Auto-reply rule not found" });
    }

    if (keyword !== undefined) autoReply.keyword = keyword;
    if (replyMessage !== undefined) autoReply.replyMessage = replyMessage;
    if (matchType !== undefined) autoReply.matchType = matchType;
    if (caseSensitive !== undefined) autoReply.caseSensitive = caseSensitive;
    if (enabled !== undefined) autoReply.enabled = enabled;
    if (priority !== undefined) autoReply.priority = priority;
    autoReply.updatedAt = new Date();

    const updatedAutoReply = await autoReply.save();
    res.json({ autoReply: updatedAutoReply });
  } catch (error) {
    logger.error(`Error updating auto-reply ${req.params.id}:`, error);
    res.status(500).json({ error: "Server error" });
  }
};

// @desc    Delete an auto-reply rule
// @route   DELETE /api/v1/autoreplies/:id
// @access  Protected
const deleteAutoReply = async (req, res) => {
  try {
    const autoReply = await AutoReply.findOneAndDelete({ _id: req.params.id, adminId: req.admin._id });

    if (!autoReply) {
      return res.status(404).json({ error: "Auto-reply rule not found or not authorized to delete" });
    }
    res.json({ message: "Auto-reply rule deleted successfully." });
  } catch (error) {
    logger.error(`Error deleting auto-reply ${req.params.id}:`, error);
    res.status(500).json({ error: "Server error" });
  }
};

// This function would be called by whatsapp.service.js when a new message is received
const checkAndTriggerAutoReply = async (adminId, receivedMessageContent, senderJid) => {
    if (typeof receivedMessageContent !== "string" || receivedMessageContent.trim() === "") {
        return false; // No content to match
    }

    try {
        const rules = await AutoReply.find({ adminId: adminId, enabled: true }).sort({ priority: 1 });
        if (!rules.length) {
            return false;
        }

        for (const rule of rules) {
            let match = false;
            const keyword = rule.caseSensitive ? rule.keyword : rule.keyword.toLowerCase();
            const messageText = rule.caseSensitive ? receivedMessageContent : receivedMessageContent.toLowerCase();

            switch (rule.matchType) {
                case "exact":
                    if (messageText === keyword) match = true;
                    break;
                case "contains":
                    if (messageText.includes(keyword)) match = true;
                    break;
                case "startsWith":
                    if (messageText.startsWith(keyword)) match = true;
                    break;
                case "regex":
                    try {
                        const regex = new RegExp(rule.keyword, rule.caseSensitive ? "" : "i");
                        if (regex.test(receivedMessageContent)) match = true;
                    } catch (e) {
                        logger.warn(`Invalid regex in auto-reply rule ${rule._id}: ${rule.keyword}`);
                    }
                    break;
                default:
                    if (messageText.includes(keyword)) match = true; // Default to contains
            }

            if (match) {
                logger.info(`Auto-reply triggered for JID ${senderJid} by rule ID ${rule._id} (keyword: "${rule.keyword}")`);
                await whatsappService.sendMessage(senderJid, { text: rule.replyMessage });
                // TODO: Save the auto-reply message to the DB as an outgoing message
                // This would involve calling a similar function to sendMessageController but marking it as auto-reply
                // For now, we just send it.
                return true; // Stop after the first matching rule (highest priority)
            }
        }
        return false; // No rule matched
    } catch (error) {
        logger.error("Error checking/triggering auto-reply:", error);
        return false;
    }
};


module.exports = {
  getAutoReplies,
  createAutoReply,
  getAutoReplyById,
  updateAutoReply,
  deleteAutoReply,
  checkAndTriggerAutoReply, // Export for use in whatsapp.service.js
};

