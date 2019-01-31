const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');

module.exports.init = () => {
  const episodeSchema = new mongoose.Schema({
    podcast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Podcast',
      autopopulate: true
    },
    shortId: String,
    title: String,
    description: String,
    image: String,
    mp3URL: String,
    releaseDate: Date,
    shareURLs: [String],
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
      }
    ],
    duration: Number,
    parentalRating: Number,
    ratingRiaa: Number
  });

  episodeSchema.plugin(autopopulate);

  // eslint-disable-next-line no-unused-vars
  const Episode = mongoose.model('Episode', episodeSchema);
};
