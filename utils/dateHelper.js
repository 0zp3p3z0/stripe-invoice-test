const moment = require('moment-timezone');
const config = require('../config');

class DateHelper {
  constructor() {
    this.timezone = config.system.timezone;
    this.transferTime = config.system.transferTime;
  }

  /**
   * Get current date/time in GMT+4
   */
  getCurrentMoment() {
    return moment().tz(this.timezone);
  }

  /**
   * Get start and end of current day in GMT+4
   */
  getCurrentDayRange() {
    const now = this.getCurrentMoment();
    const startOfDay = now.clone().startOf('day');
    const endOfDay = now.clone().endOf('day');
    
    return {
      start: startOfDay.unix(),
      end: endOfDay.unix(),
      startDate: startOfDay.format('YYYY-MM-DD'),
      endDate: endOfDay.format('YYYY-MM-DD')
    };
  }

  /**
   * Calculate new due date based on cyclical delay scheme
   */
  calculateNewDueDate(invoiceNumber) {
    const delayScheme = config.system.delayScheme;
    const cyclePosition = ((invoiceNumber - 1) % delayScheme.length);
    const daysOffset = delayScheme[cyclePosition];
    
    const newDueDate = this.getCurrentMoment()
      .add(daysOffset, 'days')
      .hour(12)
      .minute(0)
      .second(0)
      .millisecond(0);
    
    return {
      timestamp: newDueDate.unix(),
      dateString: newDueDate.format('YYYY-MM-DD HH:mm:ss'),
      daysOffset,
      cyclePosition: cyclePosition + 1
    };
  }

  /**
   * Format timestamp to readable date
   */
  formatTimestamp(timestamp) {
    return moment.unix(timestamp).tz(this.timezone).format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Check if current time is past noon GMT+4
   */
  isPastTransferTime() {
    const now = this.getCurrentMoment();
    const transferMoment = now.clone().hour(12).minute(0).second(0);
    return now.isAfter(transferMoment);
  }
}

module.exports = new DateHelper();