const appRoot = require('app-root-path');
const path = require('path');
const { config, createLogger, format, transports } = require('winston');
// const Mail = require('../utilities/winston-mailgun');

const env = process.env.NODE_ENV || 'development';
let formatForEnv;
if (env === 'production') {
  formatForEnv = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json(),
  );
} else {
  formatForEnv = format.combine(
    format.timestamp({ format: 'M/D HH:mm:ss' }),
    format.colorize(),
    // format.cli(),
    format.printf(
      info =>
        `${info.timestamp} ${info.level}: \t${
          typeof info.message === 'object'
            ? JSON.stringify(info.message)
            : info.message
        } [${info.label}]`,
    ),
  );
}

// instantiate a new Winston Logger with the settings defined above
const logger = (caller = '') => {
  const relativeCaller = `.${path
    .dirname(caller)
    .slice(appRoot.path.length, path.dirname(caller).length)}/${path.basename(
    caller,
  )}`;
  return createLogger({
    levels: config.syslog.levels,
    level: env === 'production' ? 'info' : 'debug',
    format: format.combine(
      format.timestamp(),
      format.label({
        label: relativeCaller,
      }),
    ),
    transports: [
      new transports.Console({
        format: formatForEnv,
      }),
      // ,
      // new transports.File({
      //   level: 'info',
      //   filename: `${appRoot}/logs/app.log`,
      //   maxsize: 5242880, // 5MB
      //   maxFiles: 5,
      //   format: format.json()
      // }),
      // new transports.File({
      //   level: 'error',
      //   filename: `${appRoot}/logs/error.log`,
      //   maxsize: 5242880, // 5MB
      //   maxFiles: 5,
      //   format: format.json()
      // }),
      // new Mail({
      //   level: 'alert',
      //   to: 'lehrerm@gmail.com',
      //   from: 'alert@echopig.com'
      // })
    ],
    exitOnError: false, // do not exit on handled exceptions
  });
};

module.exports = logger;
