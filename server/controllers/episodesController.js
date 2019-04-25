/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
const logger = require('../utilities/logger')(__filename);
const episodesData = require('../data/episodesData');
const podcastsController = require('./podcastsController');
const shareURLHandler = require('./apps');

module.exports = {
  findOrCreateEpisodeWithShareURL(shareURL, callback) {
    episodesData.findEpisodeByShareURL(shareURL, (err, episode) => {
      if (err) return callback(err, null);
      if (episode !== null) {
        return callback(null, episode);
      }
      return shareURLHandler(shareURL, (err, episodeData) => {
        if (err) return callback(err, null);
        const podcastData = {
          title: episodeData.podcastTitle,
          iTunesID: episodeData.podcastiTunesID,
          artwork: {
            unknown: episodeData.podcastArtwork || null
          },
          author: episodeData.podcastAuthor || null,
          listenNotesID: episodeData.podcastListenNotesID || null,
          appURL: episodeData.appPodcastURL || null
        };
        return podcastsController.findOrCreatePodcast(
          podcastData,
          (err, podcast) => {
            if (err) return callback(err, null);
            const newEpisodeData = episodeData;
            newEpisodeData.podcast = podcast;
            return episodesData.findEpisodeBymp3URL(
              newEpisodeData.mp3URL,
              (err, existingEpisode) => {
                if (err) return callback(err, null);
                if (existingEpisode !== null) {
                  // push new share URL to episode
                  episodesData.addShareURLtoEpisode(
                    shareURL,
                    existingEpisode,
                    (err, ep) => {
                      if (err)
                        logger.error(`Error on share URL add to episode ${ep}`);
                    }
                  );
                  return callback(null, existingEpisode);
                }
                return episodesData.addNewEpisode(
                  newEpisodeData,
                  (err, newEpisode) => {
                    if (err) return callback(err, null);
                    return callback(null, newEpisode);
                  }
                );
              }
            );
          }
        );
      });
    });
  },
  addPostOfEpisode(post, episode, callback) {
    episodesData.addPostOfEpisode(post, episode, callback);
  },
  removePostOfEpisode(postId, callback) {
    episodesData.removePostOfEpisode(postId, callback);
  },
  addSaveOfEpisode(save, episode, callback) {
    episodesData.addSaveOfEpisode(save, episode, callback);
  },
  removeSaveOfEpisode(saveId, callback) {
    episodesData.removeSaveOfEpisode(saveId, callback);
  },
  getEpisode(req, res, next) {
    episodesData.findEpisodeById(req.params.episode, (err, episode) => {
      if (err) {
        logger.error(err);
        return next(err);
      }
      return res.render('episodes/episode', {
        currentUser: req.user,
        episode
      });
    });
  },
  findAllEpisodesOfPodcast(podcast, callback) {
    episodesData.findAllEpisodesOfPodcast(podcast, callback);
  },
  updateEpisode() {},
  deleteEpisode() {}
};
