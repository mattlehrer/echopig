const path = require('path');

const rootPath = path.normalize(`${__dirname}/../../`);
// working directory is /usr/src/app when running in docker
// need to use the docker container name for networking instead of localhost
const mongoHost =
  process.env.PWD === '/usr/src/app' ? 'echopig-mongo' : 'localhost';

module.exports = {
  development: {
    rootPath,
    db: `mongodb://${process.env.MONGO_EPDB_USERNAME}:${process.env.MONGO_EPDB_PASSWORD}@${mongoHost}`,
    waitForDb: false,
    port: process.env.PORT || 9001,
  },
  production: {
    rootPath,
    db: `mongodb+srv://${process.env.MONGO_EPDB_USERNAME}:${process.env.MONGO_EPDB_PASSWORD}@${process.env.MONGO_HOST}`,
    domain: 'echopig.com',
    waitForDb: true,
    port: process.env.PORT || 9001,
  },
};
