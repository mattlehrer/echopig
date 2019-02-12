const express = require('express');
const dotenv = require('dotenv');
const logger = require('./server/utilities/logger')(__filename);

const env = process.env.NODE_ENV || 'development';
if (env === 'production') {
  dotenv.config({ path: '.env.prod' });
} else {
  dotenv.config({ path: '.env.dev' });
}

const app = express();
const config = require('./server/config/config')[env];

require('./server/config/express')(app, config);
require('./server/config/mongoose')(config);
require('./server/config/passport')();
require('./server/config/routes')(app);

app.listen(config.port);
logger.info(`Server running on port: ${config.port}`);
