const mongoose = require('mongoose');

module.exports.init = () => {
  const podcastSchema = new mongoose.Schema({
    title: String, // collectionName
    iTunesID: Number, // collectionId
    artwork: {
      url30: String,
      url60: String,
      url100: String,
      url600: String,
      unknown: String
    },
    feedURL: String,
    author: String, // artistName
    iTunesURL: String, // collectionViewUrl
    rating: String, // collectionExplicitness & contentAdvisoryRating
    genres: [String]
  });

  // eslint-disable-next-line no-unused-vars
  const Podcast = mongoose.model('Podcast', podcastSchema);
};
