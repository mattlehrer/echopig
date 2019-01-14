const UsersController = require('./usersController');
const EpisodesController = require('./episodesController');
const RSSController = require('./rssController');

module.exports = {
  users: UsersController,
  episodes: EpisodesController,
  rss: RSSController
};
