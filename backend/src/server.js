const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db.config");
const config = require("./config");
const logger = require("./utils/logger");
const { createInitialAdmin } = require("./api/controllers/auth.controller"); // For initial admin setup
const initializeSocketIO = require("./sockets"); // To be created for Socket.IO logic
const { initializeWhatsAppService } = require("./services/whatsapp.service"); // To be created for Baileys

const PORT = config.port || 3000;

const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*", // Configure this properly for production, e.g., your frontend URL
    methods: ["GET", "POST"],
  },
});

// Pass io instance to where it's needed (e.g., services, routes through req object or a global/module export)
// For now, we can make it available to app instance if needed, or pass directly to services.
app.set("io", io); // Make io accessible in request handlers if needed via req.app.get('io')

initializeSocketIO(io); // Setup Socket.IO event handlers

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create initial admin user if it doesn't exist
    await createInitialAdmin();

    // Initialize WhatsApp Service (Baileys)
    // This needs to be carefully designed to handle QR codes, events, etc.
    // and interact with Socket.IO to send updates to the frontend.
    // The `io` instance will be passed to the WhatsApp service.
    await initializeWhatsAppService(io);

    server.listen(PORT, () => {
      logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
    });

  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on("uncaughtException", (err, origin) => {
  logger.error(`Uncaught Exception: ${err.message}, Origin: ${origin}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

