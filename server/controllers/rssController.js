/* eslint-disable no-unused-vars */
const Podcast = require('podcast');
const ua = require('universal-analytics');
const usersData = require('../data/usersData');
const logger = require('../utilities/logger')(__filename);

const gaTag = 'UA-107421772-3';

function generateFeed(publicFeed, user, callback) {
  const feedItems = publicFeed ? user.posts : user.saves;
  // create an rss feed
  // documentation: https://www.npmjs.com/package/podcast
  const feed = new Podcast({
    title: publicFeed
      ? `${user.username}'s Favorites`
      : `${user.username}'s Saved Episodes`,
    itunesSummary: publicFeed
      ? `${
          user.username
        }'s feed of favorite podcast episodes. Powered by Echopig`
      : `Powered by Echopig`,
    description: publicFeed
      ? `${
          user.username
        }'s feed of favorite podcast episodes. Powered by Echopig`
      : '',
    itunesSubtitle: publicFeed
      ? 'Create your own feed at https://www.echopig.com'
      : '',
    itunesAuthor: user.username,
    feedUrl: publicFeed
      ? `https://www.echopig.com/rss/${user.username}`
      : `https://www.echopig.com/saved/${user.saveForLaterId}`,
    siteUrl: `https://www.echopig.com/u/${user.username}`,
    generator: 'Echopig.com',
    imageUrl: 'https://www.echopig.com/images/logo.png',
    itunesImage: 'https://www.echopig.com/images/logo1500.png',
    // docs: TODO: 'https://www.echopig.com/rssDocs.html',
    author: user.name || user.username,
    language: 'en',
    // categories: ['Personal Journals'],
    // itunesCategory: ['Personal Journals'],
    pubDate: feedItems.length > 0 ? feedItems[0].updatedAt : user.updatedAt,
    ttl: '60',
    itunesOwner: {
      name: user.name || user.username,
      email: 'rss@echopig.com'
    },
    itunesExplicit: user.explicit
  });
  feedItems.forEach(item => {
    if (item.episode) {
      feed.addItem({
        title: item.episode.title,
        description: item.episode.description,
        url: `https://www.echopig.com/e/${item.episode.id}`,
        guid: item.guid,
        categories: item.episode.podcast.genres
          ? item.episode.podcast.genres
          : [],
        author: item.episode.podcast.author ? item.episode.podcast.author : '',
        enclosure: { url: item.episode.mp3URL },
        date: item.updatedAt,
        itunesAuthor: item.episode.podcast.author
          ? item.episode.podcast.author
          : '',
        itunesExplicit: item.episode.podcast.collectionExplicitness
          ? item.episode.podcast.collectionExplicitness
          : false,
        itunesSubtitle: item.comment ? item.comment : '',
        itunesDuration: item.episode.duration ? item.episode.duration : null
      });
    }
  });
  // if we don't have any feed items,
  // we might not be able to add the feed to some podcast players
  if (!feedItems.length) {
    feed.addItem({
      title: 'Coming soon!',
      description: `${
        user.username
      } is just getting started on Echopig and will post episodes soon.`,
      url: `https://www.echopig.com/`,
      enclosure: { url: `https://www.echopig.com/assets/comingsoon.mp3` },
      date: user.updatedAt
    });
  }

  callback(null, feed.buildXml());
}

module.exports = {
  getRSSFeed(req, res, next) {
    if (req.params.username) {
      const usernameForFeed = req.params.username;
      usersData.findUserByUsername(
        usernameForFeed.toLowerCase(),
        (err, user) => {
          if (err) {
            logger.error(`${err.name}: ${err.errmsg}`);
            next(err);
            return;
          }
          if (!user) {
            next();
            return;
          }
          // log request to GA
          const feedReader = ua(gaTag);
          feedReader
            .event({
              ec: `/rss/${user.username}`, // feed for category
              ea: `${req.headers['user-agent']}` // podcatcher for action
            })
            .send();

          // eslint-disable-next-line no-shadow
          generateFeed(true, user, (err, xml) => {
            if (err) {
              logger.error(`${err.name}: ${err.errmsg}`);
              next(err);
              return;
            }
            res.set('Content-Type', 'application/rss+xml');
            res.send(xml);
          });
        }
      );
    } else {
      const err = new Error('No parameter.');
      next(err);
    }
  },
  getSaveForLaterFeed(req, res, next) {
    if (req.params.saveForLaterId) {
      const { saveForLaterId } = req.params;
      usersData.findUserBySaveForLaterId(saveForLaterId, (err, user) => {
        if (err) {
          logger.error(`${err.name}: ${err.errmsg}`);
          next(err);
          return;
        }
        if (!user) {
          next();
          return;
        }
        // log request to GA
        const feedReader = ua(gaTag);
        feedReader
          .event({
            ec: `/saves/${user.username}`, // feed for category
            ea: `${req.headers['user-agent']}` // podcatcher for action
          })
          .send();

        // eslint-disable-next-line no-shadow
        generateFeed(false, user, (err, xml) => {
          if (err) {
            logger.error(`${err.name}: ${err.errmsg}`);
            next(err);
            return;
          }
          res.set('Content-Type', 'application/rss+xml');
          res.send(xml);
        });
      });
    } else {
      const err = new Error('No parameter.');
      next(err);
    }
  }
};
