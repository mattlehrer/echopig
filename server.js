const express = require('express');
const logger = require('./server/utilities/logger')(__filename);

const env = process.env.NODE_ENV || 'development';

const app = express();
const config = require('./server/config/config')[env];

require('./server/config/express')(app, config);
const db = require('./server/config/mongoose')(config);
require('./server/config/passport')();
require('./server/config/routes')(app);

const server = app.listen(config.port);
logger.alert(`Server running on port: ${config.port}`);

// Graceful shutdown:
// The signals we want to handle
const signals = {
  SIGHUP: 1,
  SIGINT: 2,
  SIGTERM: 15
};

const shutdown = (signal, value) => {
  server.close(err => {
    if (err) {
      logger.error(JSON.stringify(err));
      process.exit(1);
    }
    logger.notice(`Server stopped by ${signal} with value ${value}`);
    // close database connection and exit with success (0 code)
    db.close(() => {
      logger.notice('Database connection disconnected');
      process.exit(0);
    });
  });
};

// Create a listener for each of the signals that we want to handle
Object.keys(signals).forEach(signal => {
  process.on(signal, () => {
    logger.alert(`process received a ${signal} signal`);
    shutdown(signal, signals[signal]);
  });
});
