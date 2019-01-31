const appRoot = require('app-root-path');
const path = require('path');
const { createLogger, format, transports } = require('winston');

const env = process.env.NODE_ENV || 'development';

// instantiate a new Winston Logger with the settings defined above
const logger = (caller = '') => {
  return createLogger({
    level: env === 'production' ? 'info' : 'debug',
    format: format.combine(
      format.timestamp(),
      format.label({ label: path.basename(caller) })
    ),
    transports: [
      new transports.File({
        level: 'info',
        filename: `${appRoot}/logs/app.log`,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: format.json()
      }),
      new transports.File({
        level: 'error',
        filename: `${appRoot}/logs/error.log`,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        format: format.json()
      }),
      new transports.Console({
        format: format.combine(
          format.timestamp({ format: 'M/D HH:mm:ss' }),
          format.cli(),
          format.printf(
            info =>
              `${info.timestamp} ${info.level}: ${info.message} [${info.label}]`
          )
        )
      })
    ],
    exitOnError: false // do not exit on handled exceptions
  });
};

module.exports = logger;
