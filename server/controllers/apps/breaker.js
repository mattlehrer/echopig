const get = require('simple-get');
const redirectChain = require('redirect-chain')();
const cheerio = require('cheerio');
const logger = require('../../utilities/logger')(__filename);

module.exports = (url, callback) => {
  get.concat(url, async (err, resp, data) => {
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
    regex = new RegExp(/(?:meta name="description" content=")([\s\S]*?)(?:")/m);
    resultArray = regex.exec(html);
    logger.debug(`with html: ${resultArray[1]}`);
    if (resultArray !== null) {
      let $ = cheerio.load(resultArray[1]);
      $ = cheerio.load($.text());
      episodeData.description = $.text();
      // logger.debug(`after cheerio's .text(): ${episodeData.description}`);
      // episodeData.description = $('p').text();
      logger.debug(`after cheerio's .text(): ${episodeData.description}`);
    } else {
      episodeData.description = '';
      errLog.description = null;
    }

    // find episode image
    // regex = new RegExp(/(?:name="og:image" content="http.*)(http.*)(?:" \/>)/gm);
    // resultArray = regex.exec(html);
    // if (resultArray === null) {
    //   episodeData.image = '';
    // } else {
    //   [, episodeData.image] = unescape(resultArray);
    // }
    // breaker always uses the main podcast image (2019-04-22)

    // find episode publish date
    // regex = new RegExp(/(?:class="margintop1">\W*)(.*)(?:\W<\/div>)/m);
    // resultArray = regex.exec(html);
    // if (resultArray !== null) {
    //   [, episodeData.releaseDate] = resultArray;
    // } else {
    //   errLog.releaseDate = null;
    // }

    // find mp3 URL
    regex = new RegExp(
      /(?:meta name="twitter:player:stream" content=")(.*)(?:")/m
    );
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.mp3URL = null;
      logger.alert(errLog);
      const error = new Error('No mp3 URL found');
      callback(error, null);
      return;
    }
    const mp3URL = await redirectChain.destination(resultArray[1]);
    episodeData.mp3URL =
      mp3URL.indexOf('?') > 0 ? mp3URL.slice(0, mp3URL.indexOf('?')) : mp3URL;
    logger.debug(episodeData.mp3URL);

    // find episode duration
    // not exposed

    // find rating
    // not exposed

    if (Object.keys(errLog).length > 2) {
      logger.alert(errLog);
    } else {
      logger.debug(`Breaker successfully parsed ${url}`);
    }
    callback(null, episodeData);
  });
};
