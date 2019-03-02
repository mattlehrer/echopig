/* eslint-disable no-unused-vars */
const UsersController = require('./usersController');
const PostsController = require('./postsController');
const EpisodesController = require('./episodesController');
const PodcastsController = require('./podcastsController');
const ProfilesController = require('./profilesController');
const RSSController = require('./rssController');
const logger = require('../utilities/logger')(__filename);

function generateTopEpisodesAndPodcasts(done) {
  const hours = 24 * 30;
  const timeframe = hours * 60 * 60 * 1000;
  const since = new Date(Date.now() - timeframe);
  const maxEpisodes = 3;
  PostsController.mostPostedEpisodesInTimeframe(
    since,
    maxEpisodes,
    (err, episodes) => {
      if (err) {
        done(err);
        return;
      }
      const maxPodcasts = 3;
      PostsController.mostPostedPodcastsInTimeframe(
        since,
        maxPodcasts,
        // eslint-disable-next-line no-shadow
        (err, podcasts) => {
          if (err) {
            done(err);
            return;
          }
          done(null, episodes, podcasts);
        }
      );
    }
  );
}

module.exports = {
  users: UsersController,
  posts: PostsController,
  episodes: EpisodesController,
  podcasts: PodcastsController,
  profiles: ProfilesController,
  rss: RSSController,
  loggedInIndex(req, res, next) {
    generateTopEpisodesAndPodcasts((err, episodes, podcasts) => {
      if (err) {
        next(err);
        return;
      }
      res.render('loggedInIndex', {
        currentUser: req.user,
        episodes,
        podcasts
      });
    });
  },
  loggedOutIndex(req, res, next) {
    generateTopEpisodesAndPodcasts((err, episodes, podcasts) => {
      if (err) {
        next(err);
        return;
      }
      res.render('loggedOutIndex', {
        currentUser: req.user,
        episodes,
        podcasts,
        csrfToken: req.csrfToken()
      });
    });
  }
};
