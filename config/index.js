require('dotenv').config();

module.exports = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  system: {
    grossVolumeLimit: parseFloat(process.env.GROSS_VOLUME_LIMIT) || 30,
    accountCurrency: process.env.ACCOUNT_CURRENCY || 'AED',
    timezone: process.env.TIMEZONE || 'Asia/Dubai',
    logLevel: process.env.LOG_LEVEL || 'INFO',
    transferTime: '12:00', // GMT+4 noon time
    delayScheme: [1, 3, 5, 7, 9] // Days offset for cyclical scheme
  },
  paths: {
    logs: './logs',
    data: './data'
  }
};