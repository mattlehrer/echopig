/* eslint-disable no-unused-vars */
const Podcast = require('podcast');

const usersData = require('../data/usersData');

module.exports = {
  getRSSFeed(req, res, next) {
    const usernameForFeed = req.params.username.toLowerCase();
    usersData.findAllLikesByUser(usernameForFeed, (err, likes) => {
      if (err) throw err;
      const mostRecent = likes.length > 0 ? likes[0].postedAt : new Date();
      /* create an rss feed */
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
      likes.forEach(ep => {
        feed.addItem({
          title: ep.comment,
          description: ep.comment,
          url: ep.episodeShareURL, // link to the post
          guid: ep.guid,
          // categories: ['Personal'], // optional - array of item categories
          // author: 'Guest Author', // optional - defaults to feed author property
          enclosure: { url: ep.episodeMP3URL },
          date: ep.postedAt,
          itunesAuthor: usernameForFeed,
          itunesExplicit: false
          // itunesSubtitle: ep.comment,
          // itunesSummary: ep.comment,
          // itunesDuration: 1234,
          // itunesKeywords: ['javascript', 'podcast']
        });
      });

      // TODO: cache the xml to send to clients
      const xml = feed.buildXml();

      res.set('Content-Type', 'application/rss+xml');
      res.send(xml);
    });
  }
};
