const puppeteer = require('puppeteer');
const logger = require('../../utilities/logger')(__filename);

const ShareURL = 'https://twitter.com/andruspurde/status/1121782235546439681';

(async () => {
  /* Initiate the Puppeteer browser */
  logger.debug('launching');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  /* Go to the page and wait for it to load */
  logger.debug('fetching');
  await page.goto(ShareURL).catch(err => logger.debug(err));
  // logger.debug(page);
  logger.debug('fetched');
  // debugger;
  const empty = await page.$$(':empty');
  logger.debug(empty);
  await page
    .click(
      '.sc-ibxdXY > span:nth-child(1) > span:nth-child(1) > span:nth-child(7) > span:nth-child(1) > span:nth-child(1) > a:nth-child(1)'
    )
    .catch(err => logger.debug(err));
  await page.click('button').catch(err => logger.debug(err));
  const data = await page
    /* Run javascript inside of the page */
    .evaluate(async () => {
      const description = document.querySelector('.sc-ibxdXY').innerText;
      // const itunesURL = document.querySelector(
      //   'div[class="button itunes_button"] > a'
      // ).href;
      // const podcastiTunesID = itunesURL.slice(
      //   itunesURL.indexOf('/id') + 3,
      //   itunesURL.indexOf('?') > itunesURL.indexOf('/id') + 3
      //     ? itunesURL.indexOf('?')
      //     : itunesURL.length
      // );
      // const mp3URLString = document.querySelector('audio[id="audio_player"]')
      //   .src;
      // const mp3URL = mp3URLString.slice(
      //   0,
      //   mp3URLString.indexOf('?') > 0
      //     ? mp3URLString.indexOf('?')
      //     : mp3URLString.length
      // );
      // const ratingCount = document.querySelector('span[itemprop="ratingCount"]')
      //   .innerText;
      /* Returning an object filled with the scraped data */
      logger.debug(document);
      return {
        // podcastiTunesID,
        description
        // mp3URL
      };
    })
    .catch(err => logger.debug(err));
  /* Outputting what we scraped */
  logger.debug(data.description);
  await browser.close();
})();
