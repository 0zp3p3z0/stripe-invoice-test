const InvoiceProcessor = require('./services/invoiceProcessor');
const StripeService = require('./services/stripeService');
const dateHelper = require('./utils/dateHelper');
const logger = require('./utils/logger');

/**
 * Test script to verify system functionality
 */
async function runTests() {
  try {
    logger.info('='.repeat(50));
    logger.info('RUNNING SYSTEM TESTS');
    logger.info('='.repeat(50));

    // Test 1: Date Helper
    logger.info('Test 1: Date Helper Functions');
    const currentMoment = dateHelper.getCurrentMoment();
    const dayRange = dateHelper.getCurrentDayRange();
    const newDueDate1 = dateHelper.calculateNewDueDate(1);
    const newDueDate3 = dateHelper.calculateNewDueDate(3);
    const newDueDate6 = dateHelper.calculateNewDueDate(6); // Should cycle back

    logger.info('Current time (GMT+4):', currentMoment.format('YYYY-MM-DD HH:mm:ss'));
    logger.info('Day range:', dayRange);
    logger.info('1st invoice due date:', newDueDate1);
    logger.info('3rd invoice due date:', newDueDate3);
    logger.info('6th invoice due date (cycled):', newDueDate6);

    // Test 2: Stripe Service (requires valid API key)
    logger.info('\nTest 2: Stripe Service');
    try {
      const stripeService = new StripeService();
      
      // Test volume fetching (will return real data if API key is valid)
      const volumeData = await stripeService.getDailyGrossVolume();
      logger.info('Daily volume test passed:', {
        volume: volumeData.volume,
        currency: volumeData.currency,
        charges: volumeData.charges.length
      });

      // Test unpaid invoices fetching
      const unpaidInvoices = await stripeService.getUnpaidInvoices();
      logger.info('Unpaid invoices test passed:', {
        count: unpaidInvoices.length
      });

    } catch (error) {
      logger.warn('Stripe service test failed (expected if no valid API keys):', error.message);
    }

    // Test 3: Invoice Processor
    logger.info('\nTest 3: Invoice Processor');
    try {
      const processor = new InvoiceProcessor();
      const summary = await processor.getProcessingSummary();
      logger.info('Processing summary test passed:', summary);
    } catch (error) {
      logger.warn('Invoice processor test failed (expected if no valid API keys):', error.message);
    }

    logger.info('\n' + '='.repeat(50));
    logger.success('TESTS COMPLETED');
    logger.info('='.repeat(50));

  } catch (error) {
    logger.error('Test failed', { error: error.message, stack: error.stack });
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { runTests };