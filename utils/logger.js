const fs = require('fs-extra');
const path = require('path');
const moment = require('moment-timezone');
const config = require('../config');

class Logger {
  constructor() {
    this.logsDir = config.paths.logs;
    this.timezone = config.system.timezone;
    this.logLevel = config.system.logLevel;
    this.ensureLogDirectory();
  }

  async ensureLogDirectory() {
    await fs.ensureDir(this.logsDir);
  }

  getCurrentTimestamp() {
    return moment().tz(this.timezone).format('YYYY-MM-DD HH:mm:ss');
  }

  getLogFileName() {
    const date = moment().tz(this.timezone).format('YYYY-MM-DD');
    return path.join(this.logsDir, `stripe-invoice-${date}.log`);
  }

  async writeToFile(level, message, data = null) {
    const timestamp = this.getCurrentTimestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    const logLine = JSON.stringify(logEntry) + '\n';
    
    try {
      await fs.appendFile(this.getLogFileName(), logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  async log(level, message, data = null) {
    const timestamp = this.getCurrentTimestamp();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    
    // Console output
    console.log(logMessage);
    if (data) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }

    // File output
    await this.writeToFile(level, message, data);
  }

  async info(message, data = null) {
    await this.log('INFO', message, data);
  }

  async warn(message, data = null) {
    await this.log('WARN', message, data);
  }

  async error(message, data = null) {
    await this.log('ERROR', message, data);
  }

  async success(message, data = null) {
    await this.log('SUCCESS', message, data);
  }

  async debug(message, data = null) {
    if (this.logLevel === 'DEBUG') {
      await this.log('DEBUG', message, data);
    }
  }
}

module.exports = new Logger();