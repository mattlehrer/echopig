const User = require('mongoose').model('User');
const Episode = require('mongoose').model('Episode');

module.exports = {
  createUser(user, callback) {
    User.create(user, callback);
  },

  updateUser(query, user, callback) {
    User.update(query, user, callback);
  },

  findAllLikesByUser(username, callback) {
    Episode.find({ postedByUser: username }, callback);
  }
};
