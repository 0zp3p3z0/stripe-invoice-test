const StripeService = require('./stripeService');
const logger = require('../utils/logger');
const dateHelper = require('../utils/dateHelper');
const config = require('../config');
const fs = require('fs-extra');
const path = require('path');

class InvoiceProcessor {
  constructor() {
    this.stripeService = new StripeService();
    this.dataDir = config.paths.data;
    this.ensureDataDirectory();
  }

  async ensureDataDirectory() {
    await fs.ensureDir(this.dataDir);
  }

  /**
   * Save transfer session data for audit purposes
   */
  async saveTransferSession(sessionData) {
    const filename = `transfer-session-${dateHelper.getCurrentMoment().format('YYYY-MM-DD-HHmmss')}.json`;
    const filepath = path.join(this.dataDir, filename);
    
    try {
      await fs.writeJson(filepath, sessionData, { spaces: 2 });
      logger.info(`Transfer session saved to ${filename}`);
    } catch (error) {
      logger.error('Failed to save transfer session', { error: error.message });
    }
  }

  /**
   * Check if gross volume limit is reached and process invoices
   */
  async checkAndProcessInvoices() {
    try {
      logger.info('='.repeat(60));
      logger.info('Starting daily invoice processing check');
      logger.info(`Current time: ${dateHelper.getCurrentMoment().format('YYYY-MM-DD HH:mm:ss')} (${config.system.timezone})`);
      logger.info(`Gross volume limit: ${config.system.grossVolumeLimit} ${config.system.accountCurrency}`);
      logger.info('='.repeat(60));

      // Step 1: Get daily gross volume
      const volumeData = await this.stripeService.getDailyGrossVolume();
      
      logger.info(`Daily gross volume: ${volumeData.volume} ${volumeData.currency}`);

      // Step 2: Check if limit is reached
      if (volumeData.volume < config.system.grossVolumeLimit) {
        logger.info(`Volume ${volumeData.volume} is below limit ${config.system.grossVolumeLimit}. No invoice processing needed.`);
        return {
          processed: false,
          reason: 'Volume below limit',
          volumeData
        };
      }

      logger.warn(`Volume limit reached! ${volumeData.volume} >= ${config.system.grossVolumeLimit}`);

      // Step 3: Get unpaid invoices
      const unpaidInvoices = await this.stripeService.getUnpaidInvoices();

      if (unpaidInvoices.length === 0) {
        logger.info('No unpaid invoices found. Nothing to process.');
        return {
          processed: false,
          reason: 'No unpaid invoices',
          volumeData
        };
      }

      // Step 4: Process invoice transfers
      logger.info(`Processing ${unpaidInvoices.length} unpaid invoices with cyclical delay scheme`);
      
      const transferredInvoices = await this.stripeService.processInvoiceTransfers(unpaidInvoices);

      // Step 5: Generate summary
      const sessionData = {
        sessionId: `session-${Date.now()}`,
        timestamp: dateHelper.getCurrentMoment().format('YYYY-MM-DD HH:mm:ss'),
        timezone: config.system.timezone,
        trigger: {
          dailyVolume: volumeData.volume,
          volumeLimit: config.system.grossVolumeLimit,
          currency: config.system.accountCurrency
        },
        processing: {
          totalUnpaidInvoices: unpaidInvoices.length,
          totalTransferred: transferredInvoices.length,
          delayScheme: config.system.delayScheme
        },
        transfers: transferredInvoices,
        volumeDetails: volumeData
      };

      // Step 6: Save session and log summary
      await this.saveTransferSession(sessionData);

      logger.success('='.repeat(60));
      logger.success('INVOICE PROCESSING COMPLETED');
      logger.success(`Processed: ${transferredInvoices.length}/${unpaidInvoices.length} invoices`);
      logger.success(`Total volume processed: ${volumeData.volume} ${volumeData.currency}`);
      logger.success('='.repeat(60));

      return {
        processed: true,
        sessionData,
        transferredInvoices,
        volumeData
      };

    } catch (error) {
      logger.error('Invoice processing failed', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get processing summary for the current day
   */
  async getProcessingSummary() {
    try {
      const volumeData = await this.stripeService.getDailyGrossVolume();
      const unpaidInvoices = await this.stripeService.getUnpaidInvoices();

      return {
        currentTime: dateHelper.getCurrentMoment().format('YYYY-MM-DD HH:mm:ss'),
        timezone: config.system.timezone,
        dailyVolume: volumeData.volume,
        volumeLimit: config.system.grossVolumeLimit,
        currency: config.system.accountCurrency,
        unpaidInvoicesCount: unpaidInvoices.length,
        limitReached: volumeData.volume >= config.system.grossVolumeLimit,
        totalCharges: volumeData.charges.length
      };
    } catch (error) {
      logger.error('Failed to get processing summary', { error: error.message });
      throw error;
    }
  }
}

module.exports = InvoiceProcessor;