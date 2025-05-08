require('dotenv').config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_manager',
  jwtSecret: process.env.JWT_SECRET || 'your_default_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  adminUsername: process.env.ADMIN_USERNAME || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'password',
  sessionConfigId: process.env.SESSION_CONFIG_ID || 'default_session',
  logLevel: process.env.LOG_LEVEL || 'info',
  botName: process.env.BOT_NAME || 'WhatsApp Manager Bot',
};

module.exports = config;

