const overcast = require('./overcast');
const podcastsApp = require('./podcastsdotapp');
const logger = require('../../utilities/logger')(__filename);

module.exports = (url, callback) => {
  if (url.search('overcast.fm') !== -1) {
    overcast(url, (error, epData) => {
      if (error) {
        const err = error;
        logger.error(error);
        err.status = 400;
        callback(err, null);
        return;
      }
      const newEpData = epData;
      newEpData.shareURLs = [url];
      callback(null, newEpData);
    });
  } else if (url.search('itunes.apple.com') !== -1) {
    podcastsApp(url, (error, epData) => {
      if (error) {
        const err = error;
        logger.error(error);
        err.status = 400;
        callback(err, null);
        return;
      }
      const newEpData = epData;
      newEpData.shareURLs = [url];
      callback(null, newEpData);
    });
  } else {
    const error = new Error('Podcast app not yet implemented');
    error.status = 501;
    callback(error, null);
  }
};

/*
https://www.quora.com/What-is-the-market-share-of-podcast-apps
Podcast hosting service Libsyn’s podcast The Feed, 
they share the podcast download numbers (from their platform) 
by apps, which may be a good proxy for podcast app market share

  Apple Podcasts: 62.53% (up)
  Spotify: 6.18% (up)
  Overcast: 2.98%
  Podcast Addict: 2.19%
  Castbox: 2.14%
  Stitcher: 2.06%
  Pocket Casts: 1.58%

Less than 1%:

  Podbean
  Player FM
  Podcasts
  Downcast
  iHeart Radio
  Tunein Radio
*/
