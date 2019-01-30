const appRoot = require('app-root-path');
const { createLogger, format, transports } = require('winston');

// define the custom settings for each transport (file, console)
const options = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/app.log`,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: format.combine(format.timestamp())
  },
  errorFile: {
    level: 'error',
    filename: `${appRoot}/logs/error.log`,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: format.combine(
      format.timestamp(),
      format.json(),
      format.uncolorize()
    )
  },
  console: {
    level: 'debug',
    format: format.combine(format.simple(), format.colorize())
  }
};

// instantiate a new Winston Logger with the settings defined above
const logger = createLogger({
  level: 'debug',
  transports: [
    new transports.File(options.file),
    new transports.File(options.errorFile),
    new transports.Console(options.console)
  ],
  exitOnError: false // do not exit on handled exceptions
});

logger.errorStream = {
  write(message) {
    logger.error({ level: 'error', message });
  }
};

logger.infoStream = {
  write(message) {
    logger.info({ level: 'info', message });
  }
};

module.exports = logger;
