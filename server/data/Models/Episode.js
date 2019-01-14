const mongoose = require('mongoose');

module.exports.init = () => {
  const episodeSchema = new mongoose.Schema({
    postedWithTag: String,
    postedAt: Date,
    postedFromEmail: String,
    postSubject: String,
    postBodyHTML: String,
    postBodyPlainText: String,
    comment: String,
    episodeShareURL: String,
    episodeMP3URL: String
  });

  // eslint-disable-next-line no-unused-vars
  const Episode = mongoose.model('Episode', episodeSchema);
};