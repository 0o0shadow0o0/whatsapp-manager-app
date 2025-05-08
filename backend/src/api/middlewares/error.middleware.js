const logger = require("../../utils/logger");
const config = require("../../config");

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);

  let errorMessage = err.message;

  // Mongoose bad ObjectId
  if (err.name === "CastError" && err.kind === "ObjectId") {
    errorMessage = "Resource not found (Invalid ID format)";
    res.status(404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    errorMessage = `Duplicate field value entered for '${field}'. Please use another value.`;
    res.status(400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((el) => el.message);
    errorMessage = `Invalid input data. ${errors.join(". ")}`;
    res.status(400);
  }

  // JWT errors (can be more specific if needed)
  if (err.name === "JsonWebTokenError") {
    errorMessage = "Not authorized, token failed (JsonWebTokenError)";
    res.status(401);
  }
  if (err.name === "TokenExpiredError") {
    errorMessage = "Not authorized, token expired (TokenExpiredError)";
    res.status(401);
  }

  logger.error(`Error: ${errorMessage}`, {
    stack: config.nodeEnv === "production" ? null : err.stack, // Only show stack in dev
    errorDetails: err, // Log full error object for debugging
  });

  res.json({
    error: errorMessage,
    // Optionally include stack trace in development
    stack: config.nodeEnv === "production" ? undefined : err.stack,
  });
};

module.exports = errorHandler;

