const get = require('simple-get');
const logger = require('../../utilities/logger')(__filename);

module.exports = (url, callback) => {
  get.concat(url, (err, resp, data) => {
    if (err) {
      return callback(err);
    }
    const episodeData = {
      // podcast: {
      //   type: 'ObjectId',
      //   ref: 'Podcast',
      //   autopopulate: true
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
      app: 'podcastsdotapp',
      url
    };

    // find Podcast iTunesID
    let regex = new RegExp(
      /(?:href=".*?)(\d*?)(?:")(?:.*&quot;targetId&quot;:&quot;LinkToPodcast&quot;)/m
    );
    let resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.podcastiTunesID = null;
      logger.alert(JSON.stringify(errLog));
      const error = new Error('no podcast iTunesID found');
      return callback(error, null);
    }
    [, episodeData.podcastiTunesID] = resultArray;

    // find mp3 URL
    regex = new RegExp(/(?:"assetUrl":")(http.*m(p3|4a).*?)(?:[?"])/gm);
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.mp3URL = null;
      logger.alert(JSON.stringify(errLog));
      const error = new Error('No mp3 URL found');
      return callback(error, null);
    }
    [, episodeData.mp3URL] = resultArray;

    // find Podcast app URL
    regex = new RegExp(
      /(?:href=")(.*?)(?:")(?:.*&quot;targetId&quot;:&quot;LinkToPodcast&quot;)/m
    );
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      [, episodeData.appPodcastURL] = resultArray;
    }

    // find Podcast title
    // regex = new RegExp(/(?:data-test-podcast-show-link>\s*)(.*)(?:\s*<\/a)/m);
    // resultArray = regex.exec(html);
    // if (resultArray !== null) {
    //   [, episodeData.podcastTitle] = resultArray;
    // } else {
    //   errLog.podcastTitle = null;
    // }

    // find Podcast Author
    // regex = new RegExp(/(?:preview-artist=")(.*?)(?:")/m);
    // resultArray = regex.exec(html);
    // if (resultArray !== null) {
    //   [, episodeData.podcastAuthor] = resultArray;
    // }

    // find Podcast artwork
    // regex = new RegExp(/(?:fullart" src=".*)(http.*)(?:"\/)/m);
    // resultArray = regex.exec(html);
    // if (resultArray !== null) {
    //   [, episodeData.podcastArtwork] = resultArray;
    // }

    // find episode title
    regex = new RegExp(/(?:name="apple:title" content=")(.*?)(?:")/m);
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.title = null;
      logger.alert(JSON.stringify(errLog));
      const error = new Error('No episode title found');
      return callback(error, null);
    }
    [, episodeData.title] = resultArray;

    // find episode description
    regex = new RegExp(/(?:episode-description>\s*?.*?>)(.*)(?:<\/p>)/m);
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      [, episodeData.description] = resultArray;
    } else {
      episodeData.description = '';
      errLog.description = null;
    }

    // find episode image
    // TODO: Does apple expose episode images?

    // find episode publish date
    regex = new RegExp(/(?:"datePublished":")(.*?)(?:")/m);
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      episodeData.releaseDate = new Date(resultArray[1]);
    } else {
      errLog.releaseDate = null;
    }

    // find episode duration
    regex = new RegExp(/(?:"duration":"PT)(.*?)(?:")/m);
    resultArray = regex.exec(html);
    try {
      if (resultArray !== null) {
        let durationString = resultArray[1];
        let duration = 0;
        if (durationString.includes('H')) {
          duration +=
            Number(durationString.slice(0, durationString.indexOf('H'))) * 3600;
          durationString = durationString.slice(
            durationString.indexOf('H') + 1
          );
        }
        if (durationString.includes('M')) {
          duration +=
            Number(durationString.slice(0, durationString.indexOf('M'))) * 60;
          durationString = durationString.slice(
            durationString.indexOf('M') + 1
          );
        }
        if (durationString.length) {
          duration += Number(
            durationString.slice(0, durationString.indexOf('S'))
          );
        }
        episodeData.duration = duration;
      } else {
        errLog.duration = null;
      }
    } catch (error) {
      errLog.duration = null;
    }

    // find riaa rating
    // regex = new RegExp(/(?:rating-riaa=")(\d*)/m);
    // resultArray = regex.exec(html);
    // if (resultArray !== null) {
    //   [, episodeData.ratingRiaa] = resultArray;
    // } else {
    //   errLog.ratingRiaa = null;
    // }

    // find parental rating
    regex = new RegExp(/(?:"contentRating":")(.*?)(?:")/m);
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      [, episodeData.parentalRating] = resultArray;
    } else {
      errLog.parentalRating = null;
    }

    if (Object.keys(errLog).length > 2) {
      logger.alert(JSON.stringify(errLog));
    } else {
      logger.debug(`podcastsDotApp successfully parsed ${url}`);
    }
    return callback(null, episodeData);
  });
};
