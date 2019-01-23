const Episode = require('mongoose').model('Episode');

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

  addShareURLtoEpisode(shareURL, episode, callback) {
    Episode.findByIdAndUpdate(
      { _id: episode.id },
      { $push: { shareURLs: shareURL } },
      callback
    );
  },

  findAllEpisodesByPodcast(podcast, callback) {
    Episode.find({ podcast }, callback);
  }
};
