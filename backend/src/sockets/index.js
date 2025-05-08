const logger = require("../utils/logger");

// This module will be responsible for handling all Socket.IO server-side logic.
// It will be called from server.js and passed the `io` instance.

const initializeSocketIO = (io) => {
  io.on("connection", (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Example: Handle a custom event from client
    socket.on("client_event_example", (data) => {
      logger.info(`Received client_event_example from ${socket.id} with data:`, data);
      // Broadcast to all clients (or specific room/client)
      // io.emit("server_event_example", { message: "Data received by server", originalData: data });
    });

    // Handle client disconnection
    socket.on("disconnect", () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // TODO: Implement specific event handlers as per api_design.md
    // - Listening for client actions (e.g., mark_as_read)
    // - Emitting server events (e.g., whatsapp_status_update, new_message, etc.)
    //   These will often be triggered by the whatsapp.service.js

    // Example: Send a welcome message to the connected client
    socket.emit("server_message", { message: "Welcome to the WhatsApp Manager Socket.IO service!" });
  });

  logger.info("Socket.IO initialized and listening for connections.");
};

module.exports = initializeSocketIO;

