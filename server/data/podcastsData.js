const Podcast = require('mongoose').model('Podcast');

module.exports = {
  addNewPodcast(podcast, callback) {
    Podcast.create(podcast, callback);
  },

  updatePodcast(id, podcastData, callback) {
    Podcast.findByIdAndUpdate(id, podcastData, callback);
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
