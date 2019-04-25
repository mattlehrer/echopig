const mongoose = require('mongoose');

const User = mongoose.model('User');

module.exports = {
  createUser(user, callback) {
    User.create(user, callback);
  },

  updateUser(user, query, callback) {
    User.updateOne(user, query, callback);
  },

  findUserByEmail(email, callback) {
    User.findOne({ normalizedEmail: email }).exec(callback);
  },

  findResetToken(token, callback) {
    User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    }).exec(callback);
  },

  findUserByTag(tag, callback) {
    User.findOne({ postTag: tag })
      .populate({ path: 'posts', options: { sort: { updatedAt: -1 } } })
      .exec(callback);
  },

  findUserByUsername(username, callback) {
    User.findOne({ normalizedUsername: username })
      .populate({ path: 'posts', options: { sort: { updatedAt: -1 } } })
      .exec(callback);
  },

  findUserBySaveForLaterId(saveForLaterId, callback) {
    User.findOne({ saveForLaterId })
      .populate({ path: 'saves', options: { sort: { updatedAt: -1 } } })
      .exec(callback);
  },

  findUserByIdWithPosts(id, callback) {
    User.findOne({ _id: id })
      .populate({ path: 'posts', options: { sort: { updatedAt: -1 } } })
      .exec(callback);
  },

  findUserByIdWithSaves(id, callback) {
    User.findOne({ _id: id })
      .populate({ path: 'saves', options: { sort: { updatedAt: -1 } } })
      .exec(callback);
  },

  addPostByUser(post, user, callback) {
    User.findByIdAndUpdate(
      { _id: user.id },
      { $push: { posts: post } },
      callback
    );
  },

  removePostByUser(postId, user, callback) {
    User.findByIdAndUpdate(
      { _id: user.id },
      { $pull: { posts: mongoose.Types.ObjectId(postId) } },
      callback
    );
  },

  addSaveByUser(save, user, callback) {
    User.findByIdAndUpdate(
      { _id: user.id },
      { $push: { saves: save } },
      callback
    );
  },

  removeSaveByUser(saveId, user, callback) {
    User.findByIdAndUpdate(
      { _id: user.id },
      { $pull: { saves: mongoose.Types.ObjectId(saveId) } },
      callback
    );
  }
};
