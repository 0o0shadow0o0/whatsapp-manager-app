const express = require("express");
const cors = require("cors");
const path = require("path");
const config = require("./config");
const logger = require("./utils/logger");

// Import routes
const authRoutes = require("./api/routes/auth.routes");
const whatsappRoutes = require("./api/routes/whatsapp.routes.js");
const conversationRoutes = require("./api/routes/conversation.routes.js");
const messageRoutes = require("./api/routes/message.routes.js");
const autoReplyRoutes = require("./api/routes/autoreply.routes.js");

// Import middlewares
const { protect } = require("./api/middlewares/auth.middleware");
const errorMiddleware = require("./api/middlewares/error.middleware.js"); // To be created

const app = express();

// Middlewares
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Logging middleware (simple example)
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/whatsapp", protect, whatsappRoutes);
app.use("/api/v1/conversations", protect, conversationRoutes);
app.use("/api/v1/messages", protect, messageRoutes);
app.use("/api/v1/autoreplies", protect, autoReplyRoutes);

// Serve frontend static files in production (if deploying backend and frontend together)
if (config.nodeEnv === "production") {
  const frontendBuildPath = path.join(__dirname, "..", "..", "frontend", "out"); // Example for Next.js static export
  logger.info("Production mode: Static file serving for frontend is illustrative and depends on deployment strategy.");
  // Actual static serving logic would go here if bundling frontend with backend server.
  // For Vercel/Netlify deployments of Next.js, this is not needed.
  // app.use(express.static(frontendBuildPath));
  // app.get("*", (req, res) => res.sendFile(path.resolve(frontendBuildPath, "index.html")));
} else {
  app.get("/", (req, res) => {
    res.send("WhatsApp Manager API is running in development mode.");
  });
}

// Error handling middleware (should be last)
app.use(errorMiddleware);

module.exports = app;

