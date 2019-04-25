const puppeteer = require('puppeteer');

const ShareURL = 'https://www.breaker.audio/econtalk/e/43637315';

(async () => {
  /* Initiate the Puppeteer browser */
  console.log('launching');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  /* Go to the page and wait for it to load */
  console.log('fetching');
  await page.goto(ShareURL).catch(err => console.log(err));
  // console.log(page);
  console.log('fetched');
  // debugger;
  const empty = await page.$$(':empty');
  console.log(empty);
  await page
    .click(
      '.sc-ibxdXY > span:nth-child(1) > span:nth-child(1) > span:nth-child(7) > span:nth-child(1) > span:nth-child(1) > a:nth-child(1)'
    )
    .catch(err => console.log(err));
  await page.click('button').catch(err => console.log(err));
  debugger;
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
      console.log(document);
      return {
        // podcastiTunesID,
        description
        // mp3URL
      };
    })
    .catch(err => console.log(err));
  /* Outputting what we scraped */
  console.log(data.description);
  await browser.close();
})();
