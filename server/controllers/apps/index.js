const overcast = require('./overcast');
const podcastsApp = require('./podcastsdotapp');
const pocketcasts = require('./pocketcasts');
const breaker = require('./breaker');
const twitter = require('./twitter');
const logger = require('../../utilities/logger')(__filename);

const domainRegex = /:\/\/(.[^/]+)/;

function handler(url, callback) {
  const domain = url.match(domainRegex)[1];

  if (domain.search('overcast.fm') !== -1) {
    overcast(url, (error, epData) => {
      if (error) {
        const err = error;
        // logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        err.status = 400;
        callback(err, null);
        return;
      }
      const newEpData = epData;
      newEpData.shareURLs = [url];
      callback(null, newEpData);
    });
  } else if (domain.search('apple.com') !== -1) {
    podcastsApp(url, (error, epData) => {
      if (error) {
        const err = error;
        // logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        err.status = 400;
        callback(err, null);
        return;
      }
      const newEpData = epData;
      newEpData.shareURLs = [url];
      callback(null, newEpData);
    });
  } else if (domain.search('pca.st') !== -1) {
    pocketcasts(url, (error, epData) => {
      if (error) {
        const err = error;
        // logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        err.status = 400;
        callback(err, null);
        return;
      }
      const newEpData = epData;
      newEpData.shareURLs = [url];
      callback(null, newEpData);
    });
  } else if (domain.search('breaker.audio') !== -1) {
    breaker(url, (error, epData) => {
      if (error) {
        const err = error;
        // logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        if (!err.status) {
          err.status = 400;
        }
        callback(err, null);
        return;
      }
      const newEpData = epData;
      newEpData.shareURLs = [url];
      callback(null, newEpData);
    });
  } else {
    logger.error(`No handler for link: ${url}`);
    const error = new Error(`Podcast app not yet implemented: ${url}`);
    error.status = 501;
    callback(error, null);
  }
}

module.exports = {
  shareURLHandler(url, callback) {
    // make sure we match the domain instead of another part of the URL
    const domain = url.match(domainRegex)[1];

    if (domain.search('twitter.com') !== -1) {
      twitter(url, (error, newUrl) => {
        if (error) {
          const err = error;
          logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
          if (!err.status) {
            err.status = 400;
          }
          callback(err, null);
          return;
        }
        handler(newUrl, callback);
      });
      return;
    }

    handler(url, callback);
  },
  handlerExists(url) {
    const domain = url.match(domainRegex)[1];

    if (domain.search('overcast.fm') !== -1) {
      return true;
    }
    if (domain.search('apple.com') !== -1) {
      return true;
    }
    if (domain.search('pca.st') !== -1) {
      return true;
    }
    if (domain.search('breaker.audio') !== -1) {
      return true;
    }
    return false;
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
