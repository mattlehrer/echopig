/* eslint-disable security/detect-object-injection */
const puppeteer = require('puppeteer');
const redirectChain = require('redirect-chain')();
const { handlerExists } = require('./index');
const logger = require('../../utilities/logger')(__filename);

module.exports = (url, callback) => {
  puppeteer
    .launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    .then(async browser => {
      const page = await browser.newPage();
      await page.goto(url);
      await page.waitForSelector('#doc');
      const title = await page.title();
      browser.close();
      const regex = new RegExp(/(https:\/\/t.co\/.*?)(?:\W)/gm);
      const urlsInTitle = [];
      let matches;
      // eslint-disable-next-line no-cond-assign
      while ((matches = regex.exec(title))) {
        urlsInTitle.push(matches[1]);
      }
      logger.debug(urlsInTitle);
      if (urlsInTitle.length > 1) {
        const destinationArray = [];
        for (let i = 0; i < urlsInTitle.length; i += 1) {
          // eslint-disable-next-line security/detect-object-injection
          const urlInTitle = urlsInTitle[i];
          // eslint-disable-next-line no-await-in-loop
          const destination = await redirectChain.destination(urlInTitle);
          logger.debug(`url: ${urlInTitle} -> ${destination}`);
          const domainRegex = /:\/\/(.[^/]+)/;
          const destinationDomain = destination.match(domainRegex)[1];
          if (destinationDomain.search('apple.com') !== -1) {
            callback(null, destination);
            return;
          }
          if (destinationDomain.search('overcast') !== -1) {
            callback(null, destination);
            return;
          }
          destinationArray.push(destination);
        }
        // TODO: if we never matched to apple.com or overcast,
        // look for other apps we can handle
        let i = 0;
        while (!handlerExists(destinationArray[i])) {
          i += 1;
        }
        if (i < destinationArray.length) {
          callback(null, destinationArray[i]);
        } else {
          logger.debug(`No handler for URLs in tweet ${url}`);
          const err = new Error(`No handler for URLs in tweet ${url}`);
          callback(err);
        }
      } else if (urlsInTitle.length === 1) {
        logger.debug(urlsInTitle[0]);
        const destination = await redirectChain.destination(urlsInTitle[0]);
        callback(null, destination);
      } else {
        logger.debug(`No URL in tweet ${url}`);
        const err = new Error(`No URL in tweet ${url}`);
        callback(err);
      }
    })
    .catch(err => {
      logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
      callback(err);
    });
};
