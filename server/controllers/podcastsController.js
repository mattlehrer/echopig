const searchitunes = require('searchitunes');

const logger = require('../utilities/logger')(__filename);
const podcastsData = require('../data/podcastsData');

module.exports = {
  findOrCreatePodcast(podcastData, callback) {
    if (podcastData.iTunesID) {
      podcastsData.findPodcastByITunesID(podcastData, (err, podcast) => {
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
    } else if (podcastData.title) {
      podcastsData.findPodcastByTitle(podcastData, (err, podcast) => {
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
  updatePodcast() {},
  deletePodcast() {}
};
