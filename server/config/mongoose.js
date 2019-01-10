const mongoose = require('mongoose');

const UserModel = require('../data/models/User');
const EpisodeModel = require('../data/models/Episode');

module.exports = config => {
  mongoose.Promise = global.Promise;
  mongoose.connect(
    config.db,
    { useNewUrlParser: true, useCreateIndex: true }
  );
  const db = mongoose.connection;

  db.once('open', err => {
    if (err) {
      console.log(`Database could not be opened: ${err}`);
      return;
    }

    console.log('Database up and running...');
  });

  db.on('error', err => {
    console.log(`Database error: ${err}`);
  });

  UserModel.init();
  EpisodeModel.init();
};
