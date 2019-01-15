const path = require('path');

const rootPath = path.normalize(`${__dirname}/../../`);
const mongoHost =
  process.env.PWD === '/usr/src/app' ? 'echopig-mongo' : 'localhost';

module.exports = {
  development: {
    rootPath,
    db: `mongodb://${mongoHost}/echopig`,
    port: process.env.PORT || 9001
  }
  // , production: {
  //   rootPath,
  //   db: 'mongodb://localhost/echopig',
  //   port: process.env.PORT || 9001
  // }
};
