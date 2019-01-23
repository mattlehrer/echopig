const podcastsData = require('../data/podcastsData');

module.exports = {
  findOrCreatePodcast(podcastData, callback) {
    // title: String, // collectionName
    // iTunesID: Number, // collectionId
    // artwork: {
    //   url30: String,
    //   url60: String,
    //   url100: String,
    //   url600: String
    // },
    // feedURL: String,
    // author: String, // artistName
    // iTunesURL: String, // collectionViewUrl
    // rating: String, // collectionExplicitness & contentAdvisoryRating
    // genres: [String]

    if (podcastData.iTunesID) {
      podcastsData.findPodcastByITunesID(podcastData, (err, podcast) => {
        if (podcast !== null) {
          return callback(null, podcast);
        }
        // eslint-disable-next-line no-shadow
        return podcastsData.addNewPodcast(podcastData, (err, podcast) => {
          if (err) return callback(err, null);
          return callback(null, podcast);
        });
      });
    } else if (podcastData.title) {
      podcastsData.findPodcastByTitle(podcastData, (err, podcast) => {
        if (podcast !== null) {
          return callback(null, podcast);
        }
        // eslint-disable-next-line no-shadow
        return podcastsData.addNewPodcast(podcastData, (err, podcast) => {
          if (err) return callback(err, null);
          return callback(null, podcast);
          // TODO: start a worker to find other podcast info?
        });
      });
    } else {
      const error = new Error('Not enough info to create podcast');
      callback(error, null);
    }
  },
  updatePodcast() {},
  deletePodcast() {}
};
