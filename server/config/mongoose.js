const mongoose = require('mongoose');
const logger = require('../utilities/logger')(__filename);

const UserModel = require('../data/models/User');
const EpisodeModel = require('../data/models/Episode');
const PodcastModel = require('../data/models/Podcast');
const PostModel = require('../data/models/Post');

module.exports = config => {
  mongoose.Promise = global.Promise;
  mongoose.connect(config.db, {
    dbName: 'echopig',
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
  const db = mongoose.connection;

  db.once('open', err => {
    if (err) {
      logger.error(`Database could not be opened: ${err}`);
      return;
    }

    logger.info('Database up and running...');
  });

  db.on('error', err => {
    logger.error(`Database error: ${err}`);
  });

  UserModel.init();
  EpisodeModel.init();
  PodcastModel.init();
  PostModel.init();
};
