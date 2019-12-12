const get = require('simple-get');
const { Date } = require('sugar');
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
    const $ = cheerio.load(html);
    const errLog = {
      app: 'stitcher',
      url,
    };

    // find Stitcher Podcast URL
    let regex = new RegExp(
      /(?:link rel="canonical" href="http.*stitcher.com)(.*)(?:\/e\/.*")/gm,
    );
    let resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.appPodcastURL = null;
      logger.alert(errLog);
      const error = new Error(`No Stitcher podcast URL found for ${url}`);
      callback(error, null);
      return;
    }
    [, episodeData.appPodcastURL] = resultArray;
    episodeData.appPodcastURL = `https://www.stitcher.com/${episodeData.appPodcastURL}`;
    logger.debug(`podcastURL: ${episodeData.appPodcastURL}`);

    // find Podcast title
    // logger.debug(`title: ${$('#showTitle', '#showInfo').text()}`);
    try {
      episodeData.podcastTitle = $('#showTitle', '#showInfo').text();
    } catch (e) {
      errLog.podcastTitle = null;
      logger.alert(errLog);
      const error = new Error('No podcast title found');
      callback(error, null);
      return;
    }

    // find episode title
    // logger.debug($('#embedTemplate').html());
    const embedScriptCode = cheerio.load($('#embedTemplate').html());
    // logger.debug(`ep title: ${embedScriptCode('h2').text()}`);
    episodeData.title = embedScriptCode('h2').text();

    // find episode description
    try {
      episodeData.description = $('p', '#description-full').text();
    } catch (e) {
      errLog.podcastTitle = null;
    }

    // find episode image
    // regex = new RegExp(/(?:name="og:image" content="http.*)(http.*)(?:" \/>)/gm);
    // resultArray = regex.exec(html);
    // if (resultArray === null) {
    //   episodeData.image = '';
    // } else {
    //   [, episodeData.image] = unescape(resultArray);
    // }
    // Stitcher always uses the main podcast image (2019-10-15)

    // find episode publish date
    regex = new RegExp(/(?:pubDate: ')(.*?)(?:')/m);
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      const [, dateString] = resultArray;
      episodeData.releaseDate = Date.create(dateString);
    } else {
      errLog.releaseDate = null;
    }
    logger.debug(`releaseDate: ${episodeData.releaseDate}`);

    // find mp3 URL
    regex = new RegExp(/(?:episodeURL: ")(.*)(?:")/m);
    resultArray = regex.exec(html);
    if (resultArray === null) {
      errLog.mp3URL = null;
      logger.alert(errLog);
      const error = new Error('No mp3 URL found');
      callback(error, null);
      return;
    }
    const urlsChain = await redirectChain.urls(resultArray[1]);
    const mp3URL = urlsChain.length > 0 ? urlsChain[1] : urlsChain[0];
    try {
      episodeData.mp3URL =
        mp3URL.indexOf('?') > 0 ? mp3URL.slice(0, mp3URL.indexOf('?')) : mp3URL;
    } catch (e) {
      [, episodeData.mp3URL] = resultArray;
    }

    // find episode duration
    regex = new RegExp(/(?:duration: )(\d*)/m);
    resultArray = regex.exec(html);
    if (resultArray !== null) {
      const [, seconds] = resultArray;
      episodeData.duration = Number(seconds);
    } else {
      errLog.duration = null;
    }
    logger.debug(`duration: ${episodeData.duration}`);

    // find rating
    // not exposed

    if (Object.keys(errLog).length > 2) {
      logger.alert(JSON.stringify(errLog));
    } else {
      logger.debug(`Stitcher successfully parsed ${url}`);
    }
    callback(null, episodeData);
  });
};
