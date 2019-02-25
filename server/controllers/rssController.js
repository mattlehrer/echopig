/* eslint-disable no-unused-vars */
const Podcast = require('podcast');
const usersData = require('../data/usersData');
const logger = require('../utilities/logger')(__filename);

module.exports = {
  getRSSFeed(req, res, next) {
    const usernameForFeed = req.params.username;
    usersData.findUserByUsername(usernameForFeed.toLowerCase(), (err, user) => {
      if (err) {
        logger.error(`${err.name}: ${err.errmsg}`);
        next(err);
        return;
      }
      if (!user) {
        res.status(404);
        res.send('Not found');
        return;
      }
      const { posts } = user;
      // create an rss feed
      // documentation: https://www.npmjs.com/package/podcast
      const feed = new Podcast({
        title: `${user.username}'s Favorites`,
        itunesSummary: `${
          user.username
        }'s feed of favorite podcast episodes. Powered by Echopig`,
        description: `${
          user.username
        }'s feed of favorite podcast episodes. Powered by Echopig`,
        itunesSubtitle: 'Create your own feed at https://www.echopig.com',
        itunesAuthor: user.username,
        feedUrl: `https://www.echopig.com/rss/${user.username}`,
        siteUrl: `https://www.echopig.com/u/${user.username}`,
        generator: 'Echopig.com',
        imageUrl: 'https://www.echopig.com/images/logo.png',
        itunesImage: 'https://www.echopig.com/images/logo1500.png',
        // docs: TODO: 'https://www.echopig.com/rssDocs.html',
        author: user.name || user.username,
        language: 'en',
        categories: ['Personal Journals'],
        itunesCategory: ['Personal Journals'],
        pubDate: posts.length > 0 ? posts[0].updatedAt : user.updatedAt,
        ttl: '60',
        itunesOwner: {
          name: usernameForFeed,
          email: 'rss@echopig.com'
        },
        itunesExplicit: user.explicit
      });
      posts.forEach(post => {
        feed.addItem({
          title: post.episode.title,
          description: post.episode.description,
          url: `https://www.echopig.com/e/${post.episode.id}`,
          guid: post.guid,
          categories:
            post.episode.podcast.genres !== null
              ? post.episode.podcast.genres
              : [],
          author:
            post.episode.podcast.author !== null
              ? post.episode.podcast.author
              : '',
          enclosure: { url: post.episode.mp3URL },
          date: post.updatedAt,
          itunesAuthor:
            post.episode.podcast.author !== null
              ? post.episode.podcast.author
              : '',
          itunesExplicit:
            post.episode.podcast.collectionExplicitness !== null
              ? post.episode.podcast.collectionExplicitness
              : false,
          itunesSubtitle: post.comment !== null ? post.comment : '',
          itunesDuration:
            post.episode.duration !== null ? post.episode.duration : null
        });
      });

      const xml = feed.buildXml();

      res.set('Content-Type', 'application/rss+xml');
      res.send(xml);
    });
  }
};
