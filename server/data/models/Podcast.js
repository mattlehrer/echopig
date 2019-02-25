const mongoose = require('mongoose');

module.exports.init = () => {
  const podcastSchema = new mongoose.Schema({
    iTunesID: { type: Number, alias: 'collectionId' },
    author: { type: String, alias: 'artistName' },
    title: { type: String, alias: 'collectionName' },
    collectionViewUrl: { type: String, alias: 'iTunesURL' },
    feedUrl: String,
    artworkUrl30: String,
    artworkUrl60: String,
    artworkUrl100: String,
    collectionExplicitness: String,
    trackExplicitness: String,
    country: String,
    primaryGenreName: String,
    contentAdvisoryRating: String,
    artworkUrl600: String,
    genreIds: [Number],
    genres: [String]
  });

  mongoose.model('Podcast', podcastSchema);
};