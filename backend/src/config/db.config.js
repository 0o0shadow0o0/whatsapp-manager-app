const mongoose = require("mongoose");
const config = require("./index");
const logger = require("../utils/logger"); // Assuming logger will be created

const connectDB = async () => {
  try {
    await mongoose.connect(config.mongodbUri, {
      useNewUrlParser: true, // Deprecated but often included in older examples, Mongoose 6+ handles this by default
      useUnifiedTopology: true, // Deprecated, Mongoose 6+ handles this by default
      // Mongoose 6+ no longer supports these options, but it's good to be aware if using older versions
      // For Mongoose 6+, these are not needed and might cause errors if strict mode is on.
      // If you encounter issues, remove useNewUrlParser and useUnifiedTopology.
    });
    logger.info("MongoDB Connected successfully.");

    // Optional: Listen for events
    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected.");
    });

  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;

