const InvoiceProcessor = require('./services/invoiceProcessor');
const logger = require('./utils/logger');
const config = require('./config');

/**
 * Main application entry point
 */
async function main() {
  try {
    logger.info('Starting Stripe Invoice Delay System');
    logger.info(`Configuration: ${config.system.grossVolumeLimit} ${config.system.accountCurrency} limit, ${config.system.timezone} timezone`);

    const processor = new InvoiceProcessor();

    // Check if we have required environment variables
    if (!config.stripe.secretKey) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }

    // Get current status
    const summary = await processor.getProcessingSummary();
    logger.info('Current Status:', summary);

    // Process invoices if conditions are met
    const result = await processor.checkAndProcessInvoices();

    if (result.processed) {
      logger.success(`Invoice processing completed successfully!`);
      logger.info(`Session ID: ${result.sessionData.sessionId}`);
    } else {
      logger.info(`No processing needed: ${result.reason}`);
    }

    process.exit(0);

  } catch (error) {
    logger.error('Application failed', { 
      error: error.message, 
      stack: error.stack 
    });
    process.exit(1);
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Run the application
if (require.main === module) {
  main();
}

module.exports = { main };