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
      } else {
        const { posts } = user;
        // create an rss feed
        // documentation: https://www.npmjs.com/package/podcast
        const feed = new Podcast({
          title: `${usernameForFeed}'s Favorites`,
          description: `${usernameForFeed}'s feed of favorite podcast episodes powered by Echopig`,
          feedUrl: `http://echopig.com/rss/${usernameForFeed}`,
          siteUrl: `http://echopig.com/u/${usernameForFeed}`,
          generator: 'Echopig.com',
          // imageUrl: TODO: add avatar,
          // itunesImage: TODO: add avatar,
          // docs: TODO: 'https://www.echopig.com/rssDocs.html',
          author: usernameForFeed,
          language: 'en',
          categories: ['Personal'],
          itunesCategory: ['Personal'],
          pubDate: posts.length > 0 ? posts[0].updatedAt : user.updatedAt,
          ttl: '120',
          itunesAuthor: usernameForFeed,
          itunesSubtitle: `${usernameForFeed}'s feed of favorite podcast episodes powered by Echopig`,
          itunesSummary: 'Create your own feed at http://www.echopig.com',
          itunesOwner: {
            name: usernameForFeed,
            email: 'rss@echopig.com'
          },
          itunesExplicit: false
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
      }
    });
  }
};
