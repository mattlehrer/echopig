const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');

module.exports.init = () => {
  const episodeSchema = new mongoose.Schema({
    podcast: {
      type: 'ObjectId',
      ref: 'Podcast',
      autopopulate: true
    },
    title: String,
    description: String,
    image: String,
    mp3URL: String,
    releaseDate: Date,
    shareURLs: [String],
    posts: Number,
    duration: Number,
    parentalRating: Number,
    ratingRiaa: Number
  });

  episodeSchema.plugin(autopopulate);

  // eslint-disable-next-line no-unused-vars
  const Episode = mongoose.model('Episode', episodeSchema);
};
