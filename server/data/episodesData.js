const Episode = require('mongoose').model('Episode');
const User = require('mongoose').model('User');

module.exports = {
  addNewEpisode(episode, callback) {
    Episode.create(episode, callback);
  },

  updateEpisode(query, episode, callback) {
    Episode.update(query, episode, callback);
  },

  deleteEpisode(query, episode, callback) {
    Episode.deleteOne(query, episode, callback);
  },

  findAllLikesByUser(username, callback) {
    Episode.find({ postedByUser: username }, callback);
  }
};
