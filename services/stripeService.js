const Stripe = require('stripe');
const config = require('../config');
const logger = require('../utils/logger');
const dateHelper = require('../utils/dateHelper');

class StripeService {
  constructor() {
    if (!config.stripe.secretKey) {
      throw new Error('Stripe secret key is required');
    }
    
    this.stripe = new Stripe(config.stripe.secretKey);
    this.currency = config.system.accountCurrency.toLowerCase();
  }

  /**
   * Get daily gross volume from Stripe for current day in GMT+4
   */
  async getDailyGrossVolume() {
    try {
      const dayRange = dateHelper.getCurrentDayRange();
      
      logger.debug('Fetching daily gross volume', {
        startDate: dayRange.startDate,
        endDate: dayRange.endDate,
        timezone: config.system.timezone
      });

      // Get all successful charges for the current day
      const charges = await this.stripe.charges.list({
        created: {
          gte: dayRange.start,
          lte: dayRange.end
        },
        limit: 100 // Adjust based on expected daily volume
      });

      // Calculate gross volume for the specified currency
      let grossVolume = 0;
      const processedCharges = [];

      for (const charge of charges.data) {
        if (charge.currency.toLowerCase() === this.currency && charge.status === 'succeeded') {
          const amount = charge.amount / 100; // Convert from cents
          grossVolume += amount;
          processedCharges.push({
            id: charge.id,
            amount: amount,
            currency: charge.currency,
            created: dateHelper.formatTimestamp(charge.created)
          });
        }
      }

      logger.info(`Daily gross volume calculated: ${grossVolume} ${config.system.accountCurrency}`, {
        totalCharges: processedCharges.length,
        dateRange: dayRange
      });

      return {
        volume: grossVolume,
        currency: config.system.accountCurrency,
        charges: processedCharges,
        dateRange: dayRange
      };

    } catch (error) {
      logger.error('Failed to get daily gross volume', { error: error.message });
      throw error;
    }
  }

  /**
   * Get all unpaid invoices
   */
  async getUnpaidInvoices() {
    try {
      logger.debug('Fetching unpaid invoices');

      const invoices = await this.stripe.invoices.list({
        status: 'open',
        limit: 100
      });

      const unpaidInvoices = invoices.data.filter(invoice => 
        invoice.currency.toLowerCase() === this.currency
      );

      logger.info(`Found ${unpaidInvoices.length} unpaid invoices in ${config.system.accountCurrency}`);

      return unpaidInvoices.map(invoice => ({
        id: invoice.id,
        amount: invoice.amount_due / 100,
        currency: invoice.currency,
        due_date: invoice.due_date,
        customer: invoice.customer,
        created: dateHelper.formatTimestamp(invoice.created),
        current_due_date: invoice.due_date ? dateHelper.formatTimestamp(invoice.due_date) : 'No due date'
      }));

    } catch (error) {
      logger.error('Failed to get unpaid invoices', { error: error.message });
      throw error;
    }
  }

  /**
   * Update invoice due date
   */
  async updateInvoiceDueDate(invoiceId, newDueDateTimestamp) {
    try {
      const updatedInvoice = await this.stripe.invoices.update(invoiceId, {
        due_date: newDueDateTimestamp
      });

      logger.success(`Invoice ${invoiceId} due date updated`, {
        newDueDate: dateHelper.formatTimestamp(newDueDateTimestamp),
        invoiceAmount: updatedInvoice.amount_due / 100,
        currency: updatedInvoice.currency
      });

      return updatedInvoice;

    } catch (error) {
      logger.error(`Failed to update invoice ${invoiceId}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Process invoice transfers with cyclical delay
   */
  async processInvoiceTransfers(unpaidInvoices) {
    const transferredInvoices = [];
    
    logger.info(`Starting invoice transfer process for ${unpaidInvoices.length} invoices`);

    for (let i = 0; i < unpaidInvoices.length; i++) {
      const invoice = unpaidInvoices[i];
      const invoiceNumber = i + 1;
      
      try {
        const newDueDateInfo = dateHelper.calculateNewDueDate(invoiceNumber);
        
        await this.updateInvoiceDueDate(invoice.id, newDueDateInfo.timestamp);
        
        const transferInfo = {
          invoiceId: invoice.id,
          invoiceNumber,
          originalDueDate: invoice.current_due_date,
          newDueDate: newDueDateInfo.dateString,
          daysOffset: newDueDateInfo.daysOffset,
          cyclePosition: newDueDateInfo.cyclePosition,
          amount: invoice.amount,
          currency: invoice.currency,
          transferredAt: dateHelper.getCurrentMoment().format('YYYY-MM-DD HH:mm:ss')
        };

        transferredInvoices.push(transferInfo);

        logger.info(`Invoice ${invoiceNumber} transferred`, transferInfo);

        // Small delay between updates to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.error(`Failed to transfer invoice ${invoice.id}`, {
          invoiceNumber,
          error: error.message
        });
      }
    }

    return transferredInvoices;
  }
}

module.exports = StripeService;