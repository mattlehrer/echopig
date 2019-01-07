const path = require('path');

const rootPath = path.normalize(`${__dirname}/../../`);

module.exports = {
  development: {
    rootPath,
    db: 'mongodb://localhost/echopig',
    port: process.env.PORT || 9001
  }
  // , production: {
  //   rootPath,
  //   db: 'mongodb://localhost/echopig',
  //   port: process.env.PORT || 9001
  // }
};
