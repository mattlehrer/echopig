/* eslint-disable no-unused-vars */
const Podcast = require('podcast');
const usersData = require('../data/usersData');
const logger = require('../utilities/logger')(__filename);

module.exports = {
  getRSSFeed(req, res, next) {
    const usernameForFeed = req.params.username.toLowerCase();
    usersData.findUserByUsername(usernameForFeed, (err, user) => {
      if (err) {
        logger.error(`${err.name}: ${err.errmsg}`);
        next(err);
      } else {
        const { posts } = user;
        const mostRecent = posts.length > 0 ? posts[0].updatedAt : new Date();
        // create an rss feed
        const feed = new Podcast({
          title: `${usernameForFeed}'s Favorites`,
          description: `${usernameForFeed}'s feed of favorite podcast episodes powered by Echopig`,
          feedUrl: `http://echopig.com/rss/${usernameForFeed}`,
          siteUrl: `http://echopig.com/u/${usernameForFeed}`,
          generator: 'Echopig.com',
          // imageUrl: 'http://example.com/icon.png',
          // docs: 'http://example.com/rss/docs.html',
          author: usernameForFeed,
          language: 'en',
          categories: ['Personal'],
          pubDate: mostRecent,
          ttl: '120',
          itunesAuthor: usernameForFeed,
          itunesSubtitle: `${usernameForFeed}'s feed of favorite podcast episodes powered by Echopig`,
          itunesSummary: 'Create your own feed at http://www.echopig.com',
          itunesOwner: {
            name: usernameForFeed,
            email: 'owner@echopig.com'
          },
          itunesExplicit: false
          // itunesImage: 'http://link.to/image.png'
        });
        posts.forEach(post => {
          feed.addItem({
            title: post.episode.title,
            description: post.episode.description,
            url: post.shareURL, // link to the post
            guid: post.guid,
            // categories: ['Personal'], // optional - array of item categories
            // author: 'Guest Author', // optional - defaults to feed author property
            // author: post.episode.podcast.author
            enclosure: { url: post.episode.mp3URL },
            date: post.updatedAt,
            itunesAuthor: usernameForFeed,
            itunesExplicit: false
            // itunesSubtitle: post.comment,
            // itunesSummary: post.comment,
            // itunesDuration: 1234,
            // itunesKeywords: ['javascript', 'podcast']
          });
        });

        // TODO: cache the xml to send to clients
        const xml = feed.buildXml();

        res.set('Content-Type', 'application/rss+xml');
        res.send(xml);
      }
    });
  }
};
