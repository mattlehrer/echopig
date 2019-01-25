const express = require('express');

const env = process.env.NODE_ENV || 'development';

require('dotenv').config();

const app = express();
const config = require('./server/config/config')[env];

require('./server/config/express')(app, config);
require('./server/config/mongoose')(config);
require('./server/config/passport')();
require('./server/config/routes')(app);

app.listen(config.port);
console.log(`Server running on port: ${config.port}`);
