/* eslint-disable no-unused-vars */
const validator = require('validator');
const get = require('simple-get');

const episodesData = require('../data/episodesData');
const appHandler = require('./apps');

module.exports = {
  addNewEpisode(req, res, next) {
    // should send HTTP 201 on success
    // 401 for unauthorized
    // 500 on internal failure or 501 for podcast app not implemented
    const postJson = req.body;
    const newEpisodeData = {
      postedViaTag: postJson.recipient.split('@')[0].split('+')[1],
      postedAt: postJson.Date,
      postedFromEmail: postJson.sender,
      postSubject: postJson.subject,
      postBodyHTML: postJson['body-html'],
      postBodyPlainText: postJson['body-plain']
    };
    const strippedText = postJson['stripped-text'];
    let inputURL;
    try {
      inputURL = strippedText
        .slice(strippedText.indexOf('http'))
        .split(/\s/)[0]
        .trim();
      if (!validator.isURL(inputURL)) {
        throw new Error('No URL in email');
      }
    } catch (error) {
      res.status(400).send('No share URL in post');
      // return;
    }
    newEpisodeData.episodeShareURL = inputURL;
    newEpisodeData.comment = strippedText.split(inputURL).join('\n');

    get.concat(inputURL, (err, resp, data) => {
      if (err) throw err;
      let episodeMP3URL;
      if (inputURL.search('overcast.fm') !== -1) {
        episodeMP3URL = appHandler.overcast(data);
      } else if (inputURL.search('itunes.apple.com') !== -1) {
        episodeMP3URL = appHandler.podcastsApp(data);
      } else {
        req.session.error = 'Podcast app not yet implemented';
        res.status(501).send(req.session.error);
      }

      newEpisodeData.episodeMP3URL = episodeMP3URL;
      // eslint-disable-next-line no-shadow
      episodesData.addNewEpisode(newEpisodeData, (err, ep) => {
        if (err) {
          req.session.error = 'Failed to add episode';
          res.status(500).send(req.session.error);
        }
        res.status(201).send();
      });
    });
  },
  updateEpisode(req, res, next) {},
  deleteEpisode(req, res, next) {}
};
