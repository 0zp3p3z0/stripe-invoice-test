# Stripe Invoice Delay System

An automated system for transferring Stripe invoices with cyclical delay logic when daily gross volume limits are reached.

## 🎯 Overview

This system monitors daily gross volume in Stripe (GMT+4 timezone) and automatically transfers unpaid invoices with a cyclical delay scheme when the volume reaches 30 AED.

## ⚙️ Features

- **Daily Volume Monitoring**: Tracks gross volume in AED currency for GMT+4 timezone
- **Automatic Invoice Transfer**: Processes unpaid invoices when volume threshold is reached  
- **Cyclical Delay Scheme**: Applies 1, 3, 5, 7, 9 day delays in repeating cycles
- **Timezone Awareness**: All operations respect GMT+4 (Asia/Dubai) timezone
- **Comprehensive Logging**: Detailed console and file logging for audit trails
- **Error Handling**: Robust error handling with retry mechanisms
- **Data Persistence**: Saves transfer sessions for audit purposes

## 🚀 Quick Start

### 1. Environment Setup

**IMPORTANT**: You must configure your Stripe API keys before running the system.

The `.env` file has been created for you. Edit it with your actual Stripe credentials:

**Replace the placeholder values in `.env`:**

```env
STRIPE_SECRET_KEY=sk_test_your_actual_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here
GROSS_VOLUME_LIMIT=30
ACCOUNT_CURRENCY=AED
TIMEZONE=Asia/Dubai
LOG_LEVEL=INFO
```

**⚠️ The system will not start without valid Stripe API keys!**

### 2. Installation

```bash
npm install
```

### 3. Run the System

```bash
npm start
```

### 4. Development Mode

```bash
npm run dev
```

### 5. Run Tests

```bash
npm test
```

## 📊 Cyclical Delay Scheme

| Invoice Number | Days Offset | Due Date Time |
|---------------|-------------|---------------|
| 1st invoice   | +1 day      | 12:00 GMT+4   |
| 2nd invoice   | +3 days     | 12:00 GMT+4   |
| 3rd invoice   | +5 days     | 12:00 GMT+4   |
| 4th invoice   | +7 days     | 12:00 GMT+4   |
| 5th invoice   | +9 days     | 12:00 GMT+4   |
| 6th invoice   | +1 day      | 12:00 GMT+4   |
| (cycle repeats) | ... | ... |

## 📁 Project Structure

```
stripe-invoice-delay-system/
├── config/
│   └── index.js              # Configuration management
├── services/
│   ├── stripeService.js      # Stripe API interactions
│   └── invoiceProcessor.js   # Main processing logic
├── utils/
│   ├── logger.js            # Logging utilities
│   └── dateHelper.js        # Date/timezone utilities
├── logs/                    # Log files (auto-created)
├── data/                    # Transfer session data (auto-created)
├── index.js                 # Main application entry
├── test.js                  # Test script
└── README.md               # This file
```

## 🔧 Configuration

The system uses environment variables for configuration:

- `STRIPE_SECRET_KEY`: Your Stripe secret API key
- `STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key (optional)
- `GROSS_VOLUME_LIMIT`: Daily volume limit in AED (default: 30)
- `ACCOUNT_CURRENCY`: Account currency (default: AED)
- `TIMEZONE`: Timezone for calculations (default: Asia/Dubai)
- `LOG_LEVEL`: Logging level (INFO, DEBUG, WARN, ERROR)

## 📝 Logging

The system provides comprehensive logging:

- **Console Output**: Real-time processing information
- **File Logging**: Daily log files in `./logs/` directory
- **Transfer Sessions**: Detailed session data in `./data/` directory

Log files are named: `stripe-invoice-{date}.log`

## 🔍 Monitoring

The system logs detailed information about:

- Daily gross volume calculations
- Invoice processing decisions
- Due date updates with cyclical logic
- API responses and errors
- Transfer session summaries

## 🛡️ Error Handling

- Graceful handling of Stripe API errors
- Retry mechanisms for failed operations
- Comprehensive error logging
- Process termination handling

## 📊 Data Flow

1. **Volume Check**: Fetch daily gross volume from Stripe for current GMT+4 day
2. **Threshold Evaluation**: Compare volume against 30 AED limit
3. **Invoice Retrieval**: Get all unpaid invoices in AED currency
4. **Cyclical Processing**: Apply delay scheme to each invoice sequentially
5. **Due Date Updates**: Update invoice due dates to 12:00 GMT+4
6. **Logging & Audit**: Save detailed session data and logs

## 🔄 Automation

For production deployment, consider:

- **Cron Jobs**: Schedule daily execution
- **Process Managers**: Use PM2 or similar for process management
- **Monitoring**: Set up alerts for failures
- **Backup**: Regular backup of logs and session data

Example cron job (runs daily at 12:30 GMT+4):
```cron
30 12 * * * cd /path/to/stripe-invoice-delay-system && npm start
```

## 🧪 Testing

Run the test suite to verify system functionality:

```bash
npm test
```

The test script validates:
- Date helper functions
- Stripe API connectivity
- Invoice processing logic
- Configuration validation

## 📞 Support

For issues or questions:

1. Check the logs in `./logs/` directory
2. Verify your `.env` configuration
3. Test your Stripe API keys
4. Review the transfer session data in `./data/`

## 🔐 Security

- Store API keys securely in environment variables
- Use Stripe's test keys for development
- Implement proper access controls in production
- Regularly rotate API keys
- Monitor API usage and rate limits