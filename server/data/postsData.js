const Post = require('mongoose').model('Post');

module.exports = {
  addNewPost(post, callback) {
    Post.create(post, callback);
  },

  updatePost(query, post, callback) {
    Post.update(query, post, callback);
  },

  deletePost(query, callback) {
    Post.findOneAndDelete(query, callback);
  }
};
