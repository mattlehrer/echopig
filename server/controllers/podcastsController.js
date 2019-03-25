/* eslint-disable no-unused-vars */
const searchitunes = require('searchitunes');

const logger = require('../utilities/logger')(__filename);
const podcastsData = require('../data/podcastsData');
// getting TypeError: episodesController.findAllEpisodesOfPodcast is not a function
// and don't know why
// const episodesController = require('./episodesController');
const { findAllEpisodesOfPodcast } = require('../data/episodesData');
// const { findAllEpisodesOfPodcast } = require('./episodesController');
const { findMostPostedPodcastsInTimeframe } = require('../data/postsData');
const { cleanTimeframeQuery } = require('../utilities/queryUtils');

module.exports = {
  findOrCreatePodcast(podcastData, callback) {
    if (podcastData.iTunesID) {
      podcastsData.findPodcastByITunesID(
        podcastData.iTunesID,
        (err, podcast) => {
          if (err) {
            callback(err, null);
            return;
          }
          if (podcast !== null) {
            callback(null, podcast);
            return;
          }
          searchitunes({ id: podcastData.iTunesID })
            .then(data => {
              // eslint-disable-next-line no-shadow
              return podcastsData.addNewPodcast(data, (err, podcast) => {
                if (err) return callback(err, null);
                return callback(null, podcast);
              });
            })
            .catch(error => {
              logger.error(error);
            });
        }
      );
    } else if (podcastData.title) {
      podcastsData.findPodcastByTitle(podcastData.title, (err, podcast) => {
        if (podcast !== null) {
          return callback(null, podcast);
        }
        // eslint-disable-next-line no-shadow
        return podcastsData.addNewPodcast(podcastData, (err, podcast) => {
          if (err) return callback(err, null);
          searchitunes({ entity: 'podcast', term: podcastData.title, limit: 1 })
            .then(data => {
              podcastsData.updatePodcast(
                podcast.id,
                data.results[0],
                // eslint-disable-next-line no-shadow
                (err, updatedPodcast) => {
                  if (err) logger.error(err);
                  else {
                    logger.debug(
                      `updated podcast id: ${updatedPodcast.id} 
                      - title: ${updatedPodcast.title}`
                    );
                  }
                }
              );
            })
            .catch(error => {
              logger.error(error);
            });
          return callback(null, podcast);
        });
      });
    } else {
      const error = new Error('Not enough info to create podcast');
      callback(error, null);
    }
  },
  getPodcastByITunesID(req, res, next) {
    podcastsData.findPodcastByITunesID(req.params.iTunesID, (err, podcast) => {
      if (err) {
        logger.error(err);
        return next(err);
      }
      if (podcast === null) {
        const error = new Error('Podcast Not Found');
        error.status = 404;
        return next(error);
      }
      return findAllEpisodesOfPodcast(
        // can't figure out this error
        // return episodesController.findAllEpisodesOfPodcast(
        podcast,
        // eslint-disable-next-line no-shadow
        (err, episodes) => {
          if (err) {
            logger.error(err);
            return next(err);
          }
          return res.render('podcasts/podcast', {
            currentUser: req.user,
            podcast,
            episodes
          });
        }
      );
    });
  },
  getTopPodcasts(req, res, next) {
    const hours = cleanTimeframeQuery(req.query.t || 100 * 24);
    const timeframe = hours * 60 * 60 * 1000;
    const since = new Date(Date.now() - timeframe);
    const maxPodcasts = 50;
    findMostPostedPodcastsInTimeframe(since, maxPodcasts, (err, podcasts) => {
      if (err) return next(err);
      return res.render('podcasts/topPodcasts', {
        currentUser: req.user,
        podcasts
      });
    });
  },
  updatePodcast(req, res, next) {
    const { iTunesID } = req.params;
    searchitunes({ id: iTunesID })
      .then(data => {
        // eslint-disable-next-line no-shadow
        podcastsData.updatePodcastByITunesID(iTunesID, data, (err, podcast) => {
          if (err) {
            next(err);
            return;
          }
          logger.debug(podcast);
          res.redirect(req.get('Referrer') || '/');
        });
      })
      .catch(error => {
        logger.error(error);
        next(error);
      });
  },
  deletePodcast() {}
};
