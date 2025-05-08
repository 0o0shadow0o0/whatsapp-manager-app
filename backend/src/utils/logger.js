const pino = require("pino");
const config = require("../config");

const logger = pino({
  level: config.logLevel || "info",
  transport: {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname",
    },
  },
});

module.exports = logger;

