const Podcast = require('mongoose').model('Podcast');

module.exports = {
  addNewPodcast(podcast, callback) {
    Podcast.create(podcast, callback);
  },

  updatePodcast(id, podcastData, callback) {
    Podcast.findByIdAndUpdate(id, podcastData, callback);
  },

  updatePodcastByITunesID(iTunesID, podcastData, callback) {
    Podcast.findOneAndUpdate({ iTunesID }, podcastData, callback);
  },

  deletePodcast(query, podcast, callback) {
    Podcast.deleteOne(query, podcast, callback);
  },

  findPodcastByITunesID(iTunesID, callback) {
    Podcast.findOne({ iTunesID }, callback);
  },

  findPodcastByTitle(title, callback) {
    Podcast.findOne({ title }, callback);
  }
};
