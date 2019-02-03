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
  },

  // returns a sorted array of objects with _id of episode and numberOfPosts in timeframe
  findMostPostedEpisodesInTimeframe(since, callback) {
    Post.aggregate([
      { $match: { updatedAt: { $gte: since } } },
      { $group: { _id: '$episode', numberOfPosts: { $sum: 1 } } },
      { $sort: { numberOfPosts: -1 } }
    ]).exec(callback);
  }
};
