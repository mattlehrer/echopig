/* eslint-disable security/detect-object-injection */
const unirest = require('unirest');
const logger = require('../utilities/logger')(__filename);

module.exports = {
  findEpisodeWithPodcastID(epTitle, podcastID, epData, callback) {
    const episodeData = epData;
    unirest
      .get('https://listen-api.listennotes.com/api/v2/search')
      .header('X-ListenAPI-Key', process.env.LISTEN_NOTES_API_KEY)
      .query({
        q: epTitle,
        sort_by_date: 0,
        type: 'episode',
        only_in: 'title',
        ocid: podcastID,
        safe_mode: 0
      })
      .end(response => {
        if (!response.body.count) {
          // no results for this episode title when we knew the listen notes podcast ID
          logger.error(
            `No results for this episode title when we knew the Listen Notes podcast ID ${podcastID}`
          );
          const error = new Error(
            `Sorry! We could not figure out what episode this is. We have logged the error and will try to do better.`
          );
          callback(error, null);
          return;
        }
        // assume first result is right... good enough for now
        const epFound = response.body.results[0];
        // podcast info
        episodeData.podcastiTunesID = epFound.itunes_id;
        episodeData.podcastListenNotesID = epFound.podcast_id;
        // episode info
        episodeData.listenNotesID = epFound.id;
        episodeData.mp3URL = epFound.audio;
        episodeData.releaseDate = epFound.pub_date_ms;
        callback(null, episodeData);
      });
  },
  findEpisodeWithoutPodcastID(epTitle, epData, callback) {
    const episodeData = epData;
    unirest
      .get('https://listen-api.listennotes.com/api/v2/search')
      .header('X-ListenAPI-Key', process.env.LISTEN_NOTES_API_KEY)
      .query({
        q: epTitle,
        sort_by_date: 0,
        type: 'episode',
        only_in: 'title',
        safe_mode: 0
      })
      .end(response => {
        if (!response.body.count) {
          // no results for this episode title
          logger.error(`Couldn't find episode title ${epTitle}`);
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
          callback(null, episodeData);
          return;
        }
        // more than one result; look for exact match on podcast title
        for (let i = 0; i < response.body.results.length; i += 1) {
          if (
            response.body.results[i].podcast_title_original ===
            episodeData.podcastTitle
          ) {
            const episode = response.body.results[i];
            // podcast info
            episodeData.podcastiTunesID = episode.itunes_id;
            episodeData.podcastListenNotesID = episode.podcast_id;
            // episode info
            episodeData.listenNotesID = episode.id;
            episodeData.mp3URL = episode.audio;
            episodeData.releaseDate = episode.pub_date_ms;

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
                  }\n Listen notes response: ${response.body}`
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
                  .header('X-ListenAPI-Key', process.env.LISTEN_NOTES_API_KEY)
                  .query({
                    q: epTitle,
                    sort_by_date: 0,
                    type: 'episode',
                    only_in: 'title',
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

                      callback(null, episodeData);
                      // eslint-disable-next-line no-useless-return
                      return;
                    }
                  });
              }
            });
        }
        logger.error(`Couldn't find episode on Listen Notes`);
        const error = new Error(
          `Sorry! We could not figure out what episode this is. We have logged the error and will try to do better.`
        );
        callback(error, null);
        // eslint-disable-next-line no-useless-return
        return;
      });
  },
  findPodcastByTitle() {}
};
