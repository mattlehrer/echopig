const get = require('simple-get');
const logger = require('../../utilities/logger')(__filename);

module.exports = (url, callback) => {
  get.concat(url, (err, resp, data) => {
    if (err) {
      return callback(err, null);
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

    let regex = new RegExp(/(?:"canonical" href\S*\?i=)(\d+)/m);
    let resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.episodeID = null;
      logger.alert(errLog);
      const error = new Error('no episode ID found');
      return callback(error, null);
    }
    const episodeID = resultArray[1];

    // capture episode info = row in table of episodes
    regex = new RegExp(`<tr .*adam-id="${episodeID}" [\\s\\S]*?</tr>`, 'm');
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.episodeRow = null;
      logger.alert(errLog);
      const error = new Error('Episode info not found');
      return callback(error, null);
    }
    const episodeRow = resultArray[0];

    // find Podcast iTunesID
    regex = new RegExp(/(?:podcast-id=")(\d*)(?:")/m);
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.podcastiTunesID = null;
      logger.alert(errLog);
      const error = new Error('no podcast iTunesID found');
      return callback(error, null);
    }
    [, episodeData.podcastiTunesID] = resultArray;

    // find mp3 URL
    regex = new RegExp(
      `(?:audio-preview-url=")(.*mp3)(?:.*adam-id="${episodeID})`,
      'm'
    );
    resultArray = regex.exec(episodeRow);
    if (resultArray === null) {
      errLog.mp3URL = null;
      logger.alert(errLog);
      const error = new Error('no mp3 URL found');
      return callback(error, null);
    }
    [, episodeData.mp3URL] = resultArray;

    // find Podcast title
    regex = new RegExp(/(?:preview-album=")(.*?)(?:")/m);
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      [, episodeData.podcastTitle] = resultArray;
    } else {
      errLog.podcastTitle = null;
    }

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
    regex = new RegExp(/(?:sort-value=")(.*)(?:" class="name)/m);
    resultArray = regex.exec(episodeRow);
    if (resultArray === null) {
      errLog.title = null;
      logger.alert(errLog);
      const error = new Error('no episode title found');
      return callback(error, null);
    }
    [, episodeData.title] = resultArray;

    // find episode description - this needs puppeteer
    regex = new RegExp(/(?:sort-value=")(.*)(?:" class="description)/m);
    resultArray = regex.exec(episodeRow);
    if (resultArray === null) {
      episodeData.description = '';
      errLog.description = null;
    } else {
      [, episodeData.description] = resultArray;
    }

    // find episode image
    // not exposed

    // find episode publish date
    regex = new RegExp(/(?:")([\d/]*)(?:".*?class="release-date")/m);
    resultArray = regex.exec(episodeRow);
    if (resultArray !== null) {
      episodeData.releaseDate = new Date(resultArray[1]);
    } else {
      errLog.releaseDate = null;
    }

    // find episode duration
    regex = new RegExp(/(?:duration=")(\d*)/m);
    resultArray = regex.exec(episodeRow);
    if (resultArray !== null) {
      [, episodeData.duration] = resultArray;
    } else {
      errLog.duration = null;
    }

    // find riaa rating
    regex = new RegExp(/(?:rating-riaa=")(\d*)/m);
    resultArray = regex.exec(episodeRow);
    if (resultArray !== null) {
      [, episodeData.ratingRiaa] = resultArray;
    } else {
      errLog.ratingRiaa = null;
    }

    // find parental rating
    regex = new RegExp(/(?:parental-rating=")(\d*)/m);
    resultArray = regex.exec(episodeRow);
    if (resultArray !== null) {
      [, episodeData.parentalRating] = resultArray;
    } else {
      errLog.parentalRating = null;
    }

    if (Object.keys(errLog).length > 2) {
      logger.alert(errLog);
    } else {
      logger.debug(`podcastsDotApp successfully parsed ${url}`);
    }
    return callback(null, episodeData);
  });
};
