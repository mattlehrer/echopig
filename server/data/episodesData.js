const mongoose = require('mongoose');

const Episode = mongoose.model('Episode');

module.exports = {
  addNewEpisode(episode, callback) {
    Episode.create(episode, callback);
  },

  updateEpisode(query, episode, callback) {
    Episode.update(query, episode, callback);
  },

  deleteEpisode(query, episode, callback) {
    Episode.deleteOne(query, episode, callback);
  },

  findEpisodeById(id, callback) {
    Episode.findById(id, callback);
  },

  findEpisodeByShareURL(shareURL, callback) {
    Episode.findOne({ shareURLs: shareURL }, callback);
  },

  findEpisodeBymp3URL(epData, callback) {
    Episode.findOne({ mp3URL: epData.mp3URL }, callback);
  },

  addPostOfEpisode(post, episode, callback) {
    Episode.findByIdAndUpdate(
      { _id: episode.id },
      { $push: { posts: post } },
      callback
    );
  },

  removePostOfEpisode(postId, callback) {
    const objId = mongoose.Types.ObjectId(postId);
    Episode.findOneAndUpdate(
      { posts: objId },
      { $pull: { posts: objId } },
      callback
    );
  },

  addShareURLtoEpisode(shareURL, episode, callback) {
    Episode.findByIdAndUpdate(
      { _id: episode.id },
      { $push: { shareURLs: shareURL } },
      callback
    );
  },

  // findAllEpisodesOfPodcast(podcast, callback) {
  //   Episode.find({ podcast: mongoose.Types.ObjectId(podcast.id) }, callback);
  // },

  findAllEpisodesOfPodcast(podcast, callback) {
    Episode.aggregate([
      // match by podcast id
      { $match: { podcast: mongoose.Types.ObjectId(podcast.id) } },
      // in order to sort by number of posts in the posts array,
      // we have to add a field for its length
      { $addFields: { numberOfPosts: { $size: '$posts' } } },
      { $sort: { numberOfPosts: -1 } }
    ]).exec(callback);
  },

  findEpisodesInArray(episodes, callback) {
    Episode.find({ _id: { $in: episodes } }, callback);
  }
};
