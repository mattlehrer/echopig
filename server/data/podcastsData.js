const Podcast = require('mongoose').model('Podcast');

module.exports = {
  addNewPodcast(podcast, callback) {
    Podcast.create(podcast, callback);
  },

  updatePodcast(query, podcast, callback) {
    Podcast.update(query, podcast, callback);
  },

  deletePodcast(query, podcast, callback) {
    Podcast.deleteOne(query, podcast, callback);
  },

  findPodcastByITunesID(podcastData, callback) {
    Podcast.findOne({ iTunesID: podcastData.iTunesID }, callback);
  },

  findPodcastByTitle(podcastData, callback) {
    Podcast.findOne({ title: podcastData.title }, callback);
  }
};