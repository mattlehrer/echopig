const searchitunes = require('searchitunes');

const logger = require('../utilities/logger')(__filename);
const podcastsData = require('../data/podcastsData');
// getting TypeError: episodesController.findAllEpisodesOfPodcast is not a function
// and don't know why
// const episodesController = require('./episodesController');
const episodesData = require('../data/episodesData');

module.exports = {
  findOrCreatePodcast(podcastData, callback) {
    if (podcastData.iTunesID) {
      podcastsData.findPodcastByITunesID(
        podcastData.iTunesID,
        (err, podcast) => {
          if (podcast !== null) {
            return callback(null, podcast);
          }
          // eslint-disable-next-line no-shadow
          return podcastsData.addNewPodcast(podcastData, (err, podcast) => {
            if (err) return callback(err, null);
            searchitunes({ id: podcastData.iTunesID })
              .then(data => {
                podcastsData.updatePodcast(
                  podcast.id,
                  data,
                  // eslint-disable-next-line no-shadow
                  (err, updatedPodcast) => {
                    if (err) logger.error(err);
                    else {
                      logger.debug(`updated podcast: ${updatedPodcast}`);
                    }
                  }
                );
              })
              .catch(error => {
                logger.error(error);
              });
            return callback(null, podcast);
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
                  else logger.debug(updatedPodcast);
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
      return episodesData.findAllEpisodesOfPodcast(
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
  updatePodcast() {},
  deletePodcast() {}
};
