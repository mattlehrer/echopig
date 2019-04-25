const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');
const shortid = require('shortid');

module.exports.init = () => {
  const episodeSchema = new mongoose.Schema({
    _id: {
      type: String,
      default: shortid.generate
    },
    podcast: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Podcast',
      autopopulate: true
    },
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
    saves: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Save'
      }
    ],
    duration: Number, // in seconds
    parentalRating: String,
    // ratingRiaa: Number,
    listenNotesID: String
  });

  episodeSchema.plugin(autopopulate);

  mongoose.model('Episode', episodeSchema);
};
