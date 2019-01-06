const mongoose = require('mongoose');

const UserModel = require('../data/models/User');

module.exports = config => {
  mongoose.connect(config.db);
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
};
