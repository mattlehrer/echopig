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
      app: 'pocketcasts',
      url
    };
    if (html.length < 500) {
      const error = new Error(`Bad share URL or episode removed at ${url}`);
      return callback(error, null);
    }

    // find Podcast iTunesID
    let regex = new RegExp(
      /(?:itunes\.apple\.com\/\w{2}\/podcast\/feed\/id)(\d*)(?:\?)/gm
    );
    let resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.podcastiTunesID = null;
      logger.alert(errLog);
      const error = new Error(`No podcast iTunesID found for ${url}`);
      return callback(error, null);
    }
    [, episodeData.podcastiTunesID] = resultArray;

    // find Podcast title
    // regex = new RegExp(/(?: &mdash; )(.*)(?: &mdash; )/gm);
    // resultArray = regex.exec(html);
    // if (resultArray !== null) {
    //   [, episodeData.podcastTitle] = resultArray;
    // }

    // find Podcast artwork
    // regex = new RegExp(/(?:fullart" src=".*)(http.*)(?:"\/)/gm);
    // resultArray = regex.exec(html);
    // if (resultArray !== null) {
    //   episodeData.podcastArtwork = unescape(resultArray[1]);
    // }

    // find mp3 URL
    regex = new RegExp(/(?:id="audio_player" src=")(.*mp3)(?:" )/gm);
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.mp3URL = null;
      logger.alert(errLog);
      const error = new Error('No mp3 URL found');
      return callback(error, null);
    }
    [, episodeData.mp3URL] = resultArray;

    // find episode title
    regex = new RegExp(/(?:class="section">\s*<h1>)(.*)(?:<\/h1>)/gm);
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.title = null;
      logger.alert(errLog);
      const error = new Error('No episode title found');
      return callback(error, null);
    }
    [, episodeData.title] = resultArray;

    // find episode description
    // TODO: use puppeteer to expose this
    // regex = new RegExp(/(?:class="section show_notes">)(.*)(?:<)/gm);
    // resultArray = regex.exec(html);
    // if (resultArray !== null) {
    //   [, episodeData.description] = resultArray;
    // } else {
    //   episodeData.description = '';
    //   errLog.description = null;
    // }

    // find episode image
    // regex = new RegExp(//gm);
    // resultArray = regex.exec(html);
    // if (resultArray === null) {
    //   episodeData.image = '';
    // } else {
    //   [, episodeData.image] = unescape(resultArray);
    // }
    // pocket casts always uses the main podcast image (2019-01-18)

    // find episode publish date
    regex = new RegExp(/(?:id="episode_date">)(.*)(?:<)/m);
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      [, episodeData.releaseDate] = resultArray;
    } else {
      errLog.releaseDate = null;
    }

    // find episode duration
    regex = new RegExp(/(?:id="duration_time" data-duration=")(.*)(?:")/m);
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      [, episodeData.duration] = resultArray;
    } else {
      errLog.duration = null;
    }

    // find rating
    // not exposed

    if (Object.keys(errLog).length > 2) {
      logger.alert(errLog);
    } else {
      logger.debug(`Successfully parsed Pocket Casts: ${url}`);
    }
    return callback(null, episodeData);
  });
};
