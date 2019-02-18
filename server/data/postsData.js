const mongoose = require('mongoose');

const Post = mongoose.model('Post');

module.exports = {
  addNewPost(post, callback) {
    Post.create(post, callback);
  },

  updatePost(post, query, callback) {
    Post.findOneAndUpdate({ _id: post.id || post }, query, callback);
  },

  deletePost(query, callback) {
    Post.findOneAndDelete(query, callback);
  },

  // returns a sorted array of objects with _id of episode and numberOfPosts after since
  findMostPostedEpisodesInTimeframe(since, callback) {
    Post.aggregate([
      { $match: { updatedAt: { $gte: since } } },
      { $sortByCount: '$episode' },
      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: '_id',
          as: 'episode'
        }
      },
      { $unwind: '$episode' },
      {
        $lookup: {
          from: 'podcasts',
          localField: 'episode.podcast',
          foreignField: '_id',
          as: 'episode.podcast'
        }
      },
      { $unwind: '$episode.podcast' }
    ]).exec((err, episodes) => {
      if (err) callback(err, null);
      else
        callback(
          null,
          episodes.map(e => {
            // add id property because this is returning an array of objects, not mongoose documents
            // eslint-disable-next-line no-underscore-dangle
            e.episode.id = e.episode._id;
            return e.episode;
          })
        );
    });
  },

  // returns a sorted array of objects with _id of episode and numberOfPosts after since
  findMostPostedEpisodesInGenreInTimeframe(genre, since, callback) {
    Post.aggregate([
      { $match: { updatedAt: { $gte: since } } },
      { $sortByCount: '$episode' },
      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: '_id',
          as: 'episode'
        }
      },
      { $unwind: '$episode' },
      {
        $lookup: {
          from: 'podcasts',
          localField: 'episode.podcast',
          foreignField: '_id',
          as: 'episode.podcast'
        }
      },
      { $unwind: '$episode.podcast' },
      { $unwind: '$episode.podcast.genres' },
      // do a case insensitive search for genre
      {
        $match: {
          'episode.podcast.genres': { $regex: `^${genre}$`, $options: 'i' }
        }
      }
    ]).exec((err, episodes) => {
      if (err) callback(err, null);
      else
        callback(
          null,
          episodes.map(e => {
            // add id property because this is returning an array of objects, not mongoose documents
            // eslint-disable-next-line no-underscore-dangle
            e.episode.id = e.episode._id;
            return e.episode;
          })
        );
    });
  }
};
