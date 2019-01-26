const User = require('mongoose').model('User');

module.exports = {
  createUser(user, callback) {
    User.create(user, callback);
  },

  updateUser(query, user, callback) {
    User.update(query, user, callback);
  },

  findUserByTag(tag, callback) {
    User.findOne({ postTag: tag })
      .populate({ path: 'posts', options: { sort: { updatedAt: -1 } } })
      .exec(callback);
  },

  findUserByUsername(username, callback) {
    User.findOne({ username })
      .populate({ path: 'posts', options: { sort: { updatedAt: -1 } } })
      .exec(callback);
  },

  findUserByIdWithPosts(id, callback) {
    User.findOne({ _id: id })
      .populate({ path: 'posts', options: { sort: { updatedAt: -1 } } })
      .exec(callback);
  },

  addPostByUser(post, user, callback) {
    User.findByIdAndUpdate(
      { _id: user.id },
      { $push: { posts: post } },
      callback
    );
  },

  removePostByUser(post, user, callback) {
    User.findByIdAndUpdate(
      { _id: user.id },
      { $pull: { posts: post } },
      callback
    );
  }
};
