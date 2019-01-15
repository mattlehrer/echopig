const User = require('mongoose').model('User');

module.exports = {
  createUser(user, callback) {
    User.create(user, callback);
  },

  updateUser(query, user, callback) {
    User.update(query, user, callback);
  },

  findUsernameByTag(tag, callback) {
    User.findOne({ postTag: tag }, 'username', callback);
  },

  doesUserExist(username, callback) {
    User.findOne({ username }, callback);
  }
};
