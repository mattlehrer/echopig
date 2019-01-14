const mongoose = require('mongoose');

module.exports.init = () => {
  const episodeSchema = new mongoose.Schema({
    postedByUser: String,
    postedAt: Date,
    postedFromEmail: String,
    postSubject: String,
    postBodyHTML: String,
    postBodyPlainText: String,
    comment: String,
    episodeShareURL: String,
    episodeMP3URL: String,
    guid: String
  });

  // eslint-disable-next-line no-unused-vars
  const Episode = mongoose.model('Episode', episodeSchema);
};
