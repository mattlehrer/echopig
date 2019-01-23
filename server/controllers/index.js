const UsersController = require('./usersController');
const PostsController = require('./postsController');
const EpisodesController = require('./episodesController');
const PodcastsController = require('./podcastsController');
const ProfilesController = require('./profilesController');
const RSSController = require('./rssController');

module.exports = {
  users: UsersController,
  posts: PostsController,
  episodes: EpisodesController,
  podcasts: PodcastsController,
  profiles: ProfilesController,
  rss: RSSController
};
