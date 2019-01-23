/* eslint-disable no-unused-vars */
const validator = require('validator');

const episodesData = require('../data/episodesData');
const podcastsController = require('./podcastsController');
const shareURLHandler = require('./apps');

module.exports = {
  findOrCreateEpisodeWithShareURL(shareURL, callback) {
    if (!validator.isURL(shareURL)) {
      const err = new Error('Not a URL');
      callback(err, null);
    } else {
      episodesData.findEpisodeByShareURL(shareURL, (err, episode) => {
        if (err) return callback(err, null);
        if (episode !== null) {
          return callback(null, episode);
        }
        // eslint-disable-next-line no-shadow
        return shareURLHandler(shareURL, (err, episodeData) => {
          if (err) return callback(err, null);
          const podcastData = {
            title: episodeData.podcastTitle,
            iTunesID: episodeData.podcastiTunesID,
            artwork: {
              unknown: episodeData.podcastArtwork || ''
            },
            author: episodeData.podcastAuthor || ''
          };
          return podcastsController.findOrCreatePodcast(
            podcastData,
            // eslint-disable-next-line no-shadow
            (err, podcast) => {
              if (err) return callback(err, null);
              const newEpisodeData = episodeData;
              newEpisodeData.podcast = podcast;
              // TODO: always adds a new episode if the share url doesn't exist yet
              // check db for mp3 url and update missing fields if we got new info
              // eslint-disable-next-line no-shadow
              return episodesData.addNewEpisode(newEpisodeData, (err, ep) => {
                if (err) return callback(err, null);
                return callback(null, ep);
              });
            }
          );
        });
      });
    }
  },
  updateEpisode() {},
  deleteEpisode() {}
};
