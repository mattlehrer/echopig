const User = require('mongoose').model('User');

module.exports = {
  createUser(user, callback) {
    User.create(user, callback);
  },

  updateUser(query, user, callback) {
    User.update(query, user, callback);
  }
};
