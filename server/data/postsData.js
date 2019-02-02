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

  findMostPostedEpisodesInTimeframe(since, callback) {
    Post.aggregate([
      { $match: { updatedAt: { $gte: since } } },
      { $group: { _id: '$episode', numberOfPosts: { $sum: 1 } } },
      { $sort: { numberOfPosts: -1 } },
      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: '_id',
          as: 'data'
        }
      }
      // TODO $lookup to add podcast itunesId and title from podcasts collection
    ]).exec(callback);
  }
};
