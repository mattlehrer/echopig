/* eslint-disable no-unused-vars */
const searchitunes = require('searchitunes');
const { validationResult } = require('express-validator');

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
            // check if we should update
            let updated = false;
            if (podcastData.appURL) {
              updated = true;
              // add app url for podcast
              if (podcast.appURLs) {
                podcast.appURLs.addToSet(podcastData.appURL);
              } else {
                podcast.set({ appURLs: [podcastData.appURL] });
              }
            }
            // if we don't have the listen notes ID for this podcast
            // and we just grabbed it, save it
            if (!podcast.listenNotesID && podcastData.listenNotesID) {
              podcast.set({ listenNotesID: podcastData.listenNotesID });
              updated = true;
            }
            if (podcast.listenNotesID && podcastData.listenNotesID) {
              if (podcast.listenNotesID !== podcastData.listenNotesID) {
                logger.error(
                  `Listen Notes ID doesn't match for podcast ${podcast.id}. Have ${podcast.listenNotesID} in db and now see ${podcastData.listenNotesID}`,
                );
              }
            }
            if (updated) {
              // eslint-disable-next-line no-shadow
              podcast.save(err => {
                if (err)
                  logger.error(
                    JSON.stringify(err, Object.getOwnPropertyNames(err)),
                  );
              });
            }
            callback(null, podcast);
            return;
          }
          // no podcast found, create one
          searchitunes({ id: podcastData.iTunesID })
            .then(data => {
              const newPodcast = data;
              if (podcastsData.listenNotesID)
                newPodcast.listenNotesID = podcastData.listenNotesID;
              if (podcastData.appURL) newPodcast.appURLs = [podcastData.appURL];
              // eslint-disable-next-line no-shadow
              return podcastsData.addNewPodcast(newPodcast, (err, podcast) => {
                if (err) return callback(err, null);
                return callback(null, podcast);
              });
            })
            // eslint-disable-next-line no-shadow
            .catch(err => {
              logger.error(
                JSON.stringify(err, Object.getOwnPropertyNames(err)),
              );
              return callback(err);
            });
        },
      );
    } else if (podcastData.title) {
      podcastsData.findPodcastByTitle(podcastData.title, (err, podcast) => {
        if (err) {
          logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
          return callback(err, null);
        }
        if (podcast !== null) {
          // check if we should update
          let updated = false;
          if (podcastData.appURL) {
            updated = true;
            // add app url for podcast
            if (podcast.appURLs) {
              podcast.appURLs.addToSet(podcastData.appURL);
            } else {
              podcast.set({ appURLs: [podcastData.appURL] });
            }
          }
          // if we don't have the listen notes ID for this podcast
          // and we just grabbed it, save it
          if (!podcast.listenNotesID && podcastData.listenNotesID) {
            podcast.set({ listenNotesID: podcastData.listenNotesID });
            updated = true;
          }
          if (podcast.listenNotesID && podcastData.listenNotesID) {
            if (podcast.listenNotesID !== podcastData.listenNotesID) {
              logger.error(
                `Listen Notes ID doesn't match for podcast ${podcast.id}. Have ${podcast.listenNotesID} in db and now see ${podcastData.listenNotesID}`,
              );
            }
          }
          if (updated) {
            // eslint-disable-next-line no-shadow
            podcast.save(err => {
              if (err)
                logger.error(
                  JSON.stringify(err, Object.getOwnPropertyNames(err)),
                );
            });
          }
          return callback(null, podcast);
        }
        return (
          searchitunes({
            entity: 'podcast',
            term: podcastData.title,
            limit: 1,
          })
            .then(data => {
              const newPodcast = data.results[0];
              if (newPodcast.collectionName !== podcastData.title)
                logger.alert(
                  `Created podcast without exact match on title; from share URL: ${podcastData.title} and from iTunes: ${newPodcast.collectionName}`,
                );
              if (podcastData.appURL) newPodcast.appURLs = [podcastData.appURL];
              // eslint-disable-next-line no-shadow
              return podcastsData.addNewPodcast(newPodcast, (err, podcast) => {
                if (err) return callback(err);
                logger.info(`Added new podcast: ${JSON.stringify(podcast)}`);
                return callback(null, podcast);
              });
            })
            // eslint-disable-next-line no-shadow
            .catch(err => {
              logger.error(
                JSON.stringify(err, Object.getOwnPropertyNames(err)),
              );
              return callback(err);
            })
        );
      });
    } else {
      const error = new Error('Not enough info to create podcast');
      callback(error);
    }
  },
  getPodcastByITunesID(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('back');
      return;
    }
    podcastsData.findPodcastByITunesID(req.params.iTunesID, (err, podcast) => {
      if (err) {
        logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
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
            logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
            return next(err);
          }
          return res.render('podcasts/podcast', {
            currentUser: req.user,
            podcast,
            episodes,
          });
        },
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
        podcasts,
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
      .catch(err => {
        logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        next(err);
      });
  },
  deletePodcast() {},
  findPodcastByAppURL(url, callback) {
    podcastsData.findPodcastByAppURL(url, callback);
  },
};
