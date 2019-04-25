const get = require('simple-get');
const unirest = require('unirest');
const { findPodcastByAppURL } = require('../podcastsController');
const logger = require('../../utilities/logger')(__filename);

module.exports = (url, callback) => {
  get.concat(url, (err, resp, data) => {
    if (err) {
      callback(err, null);
      return;
    }
    const episodeData = {
      // podcast: {
      //  podcastTitle,
      //  podcastiTunesID,
      //  podcastArtwork || ''
      //  podcastAuthor || '',
      //  podcastListenNotesID || ''
      // },
      // title: String,
      // description: String,
      // image: String,
      // mp3URL,
      // releaseDate: Date,
      // duration: Number,
      // parentalRating: Number,
      // ratingRiaa: Number
    };
    const html = data.toString('utf8');
    const errLog = {
      app: 'breaker',
      url
    };

    // find Breaker Podcast URL
    let regex = new RegExp(
      /(?:"position": 1,\s+"item": {\s+"@id": ")(https:\/\/www\.breaker\.audio\/.*)(?:")/gm
    );
    let resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.appPodcastURL = null;
      logger.alert(errLog);
      const error = new Error(`No breaker podcast URL found for ${url}`);
      callback(error, null);
      return;
    }
    [, episodeData.appPodcastURL] = resultArray;

    // find Podcast title
    regex = new RegExp(
      /(?:"position": 1,\s+"item": {\s+"@id": "https:\/\/www\.breaker\.audio\/.*",\s+"name": ")(.*)(?:")/gm
    );
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.podcastTitle = null;
      logger.alert(errLog);
      const error = new Error('No podcast title found');
      callback(error, null);
      return;
    }
    [, episodeData.podcastTitle] = resultArray;

    // find episode title
    regex = new RegExp(
      /(?:"position": 2,\s+"item": {\s+"@id": "https:\/\/www\.breaker\.audio\/.*",\s+"name": ")(.*)(?:")/gm
    );
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.title = null;
      logger.alert(errLog);
      const error = new Error('No episode title found');
      callback(error, null);
      return;
    }
    [, episodeData.title] = resultArray;

    // find episode description
    regex = new RegExp(
      /(?:meta property="og:description" content=")(.*)(?:")/gm
    );
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      [, episodeData.description] = resultArray;
    } else {
      episodeData.description = '';
      errLog.description = null;
    }

    // Breaker doesn't expose the mp3 URL or itunes ID without javascript so use listen notes.
    // Have we found the listen notes podcast ID for this podcast?
    // eslint-disable-next-line no-shadow
    findPodcastByAppURL(episodeData.appPodcastURL, (err, podcast) => {
      if (err) {
        logger.error(err);
        callback(err);
        return;
      }
      if (podcast && podcast.listenNotesID) {
        // if we have the listenNotesID, restrict search for episode to that ID
        unirest
          .get('https://listen-api.listennotes.com/api/v2/search')
          .header('X-ListenAPI-Key', process.env.LISTEN_NOTES_API_KEY)
          .query({
            q: episodeData.title,
            sort_by_date: 0,
            type: 'episode',
            only_in: 'title',
            ocid: podcast.listenNotesID,
            safe_mode: 0
          })
          .end(response => {
            if (!response.body.count) {
              // no results for this episode title when we knew the listen notes podcast ID
              logger.error(
                `No results for this episode title when we knew the Listen Notes podcast ID ${
                  podcast.listenNotesID
                } for share URL ${url}`
              );
              const error = new Error(
                `Sorry! We could not figure out what episode this is. We have logged the error and will try to do better.`
              );
              callback(error, null);
              return;
            }
            // logger.debug(response.body);
            // assume first result is right... good enough for now
            const epFound = response.body.results[0];
            // podcast info
            episodeData.podcastiTunesID = epFound.itunes_id;
            episodeData.podcastListenNotesID = epFound.podcast_id;
            // episode info
            episodeData.listenNotesID = epFound.id;
            episodeData.mp3URL = epFound.audio;
            episodeData.releaseDate = epFound.pub_date_ms;
            if (Object.keys(errLog).length > 2) {
              logger.alert(`Breaker successfully parsed ${errLog}`);
            } else {
              logger.debug(`Breaker successfully parsed ${url}`);
            }
            callback(null, episodeData);
          });
      } else {
        // we don't have listen notes podcast id; search for episode title across all podcasts
        unirest
          .get('https://listen-api.listennotes.com/api/v2/search')
          .header('X-ListenAPI-Key', process.env.LISTEN_NOTES_API_KEY)
          .query({
            q: episodeData.title,
            sort_by_date: 0,
            type: 'episode',
            only_in: 'title',
            safe_mode: 0
          })
          .end(response => {
            // logger.debug(response.body);
            if (!response.body.count) {
              // no results for this episode title on listen notes
              // TODO: need to use puppeteer?
              logger.error(
                `Couldn't find episode title ${
                  episodeData.title
                } on Listen Notes for share URL ${url}`
              );
              const error = new Error(
                `Sorry! We could not figure out what episode that is. We have logged the error and will try to do better.`
              );
              error.status = 404;
              callback(error, null);
              return;
            }
            if (response.body.results.length === 1) {
              // only one result so it must be right
              const epFound = response.body.results[0];
              // podcast info
              episodeData.podcastiTunesID = epFound.itunes_id;
              episodeData.podcastListenNotesID = epFound.podcast_id;
              // episode info
              episodeData.listenNotesID = epFound.id;
              episodeData.mp3URL = epFound.audio;
              episodeData.releaseDate = epFound.pub_date_ms;
              if (Object.keys(errLog).length > 2) {
                logger.alert(`Breaker successfully parsed ${errLog}`);
              } else {
                logger.debug(`Breaker successfully parsed ${url}`);
              }
              callback(null, episodeData);
              return;
            }
            // more than one result; look for exact match on podcast title
            for (let i = 0; i < response.body.results.length; i += 1) {
              if (
                // eslint-disable-next-line security/detect-object-injection
                response.body.results[i].podcast_title_original ===
                episodeData.podcastTitle
              ) {
                // eslint-disable-next-line security/detect-object-injection
                const episode = response.body.results[i];
                // podcast info
                episodeData.podcastiTunesID = episode.itunes_id;
                episodeData.podcastListenNotesID = episode.podcast_id;
                // episode info
                episodeData.listenNotesID = episode.id;
                episodeData.mp3URL = episode.audio;
                episodeData.releaseDate = episode.pub_date_ms;

                if (Object.keys(errLog).length > 2) {
                  logger.alert(`Breaker successfully parsed ${errLog}`);
                } else {
                  logger.debug(`Breaker successfully parsed ${url}`);
                }
                callback(null, episodeData);
                return;
              }
            }
            // no exact match on podcast title (at least in first 10 episodes)
            // check if listen notes found more than 10 episodes: next_offset is for paging
            if (response.body.next_offset > 0) {
              unirest
                .get('https://listen-api.listennotes.com/api/v2/search')
                .header('X-ListenAPI-Key', process.env.LISTEN_NOTES_API_KEY)
                .query({
                  q: episodeData.podcastTitle,
                  sort_by_date: 0,
                  type: 'podcast',
                  only_in: 'title',
                  safe_mode: 0
                })
                // eslint-disable-next-line no-shadow
                .end(response => {
                  logger.debug(response.body);
                  if (!response.body.count) {
                    logger.error(
                      `Listen notes counldn't find podcast with that title: ${
                        episodeData.podcastTitle
                      } for share URL: ${url} \n Listen notes response: ${
                        response.body
                      }`
                    );
                    const error = new Error(
                      `Sorry! We could not figure out what episode this is. We have logged the error and will try to do better.`
                    );
                    callback(error, null);
                    return;
                  }
                  // search listen notes for our episode title only on each podcast result
                  // ideally we would search for the episode and podcast names in one api call
                  // but listen notes does not currently allow that
                  for (let i = 0; i < response.body.count; i += 1) {
                    unirest
                      .get('https://listen-api.listennotes.com/api/v2/search')
                      .header(
                        'X-ListenAPI-Key',
                        process.env.LISTEN_NOTES_API_KEY
                      )
                      .query({
                        q: episodeData.title,
                        sort_by_date: 0,
                        type: 'episode',
                        only_in: 'title',
                        // eslint-disable-next-line security/detect-object-injection
                        ocid: response.body.results[i].id,
                        safe_mode: 0
                      })
                      .end(res => {
                        if (res.body.count === 1) {
                          logger.debug(res.body);
                          const epFound = res.body.results[0];
                          // podcast info
                          episodeData.podcastiTunesID = epFound.itunes_id;
                          episodeData.podcastListenNotesID = epFound.podcast_id;
                          // episode info
                          episodeData.listenNotesID = epFound.id;
                          episodeData.mp3URL = epFound.audio;
                          episodeData.releaseDate = epFound.pub_date_ms;

                          if (Object.keys(errLog).length > 2) {
                            logger.alert(
                              `Breaker successfully parsed ${errLog}`
                            );
                          } else {
                            logger.debug(`Breaker successfully parsed ${url}`);
                          }
                          callback(null, episodeData);
                          // eslint-disable-next-line no-useless-return
                          return;
                        }
                      });
                  }
                });
            }
            logger.error(
              `Couldn't find episode on Listen Notes with share URL ${url}`
            );
            const error = new Error(
              `Sorry! We could not figure out what episode this is. We have logged the error and will try to do better.`
            );
            callback(error, null);
            // eslint-disable-next-line no-useless-return
            return;
          });
      }
    });
  });
};
