const puppeteer = require('puppeteer');

const ShareURL = 'https://pca.st/W5j8';

(async () => {
  /* Initiate the Puppeteer browser */
  console.log('launching');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  /* Go to the page and wait for it to load */
  console.log('fetching');
  await page.goto(ShareURL);
  await page.waitFor(() => !!document.querySelector('.show_notes').innerText);
  /* Run javascript inside of the page */
  console.log('fetched');
  const data = await page.evaluate(() => {
    const description = document.querySelector(
      'div[class="section show_notes"]'
    ).innerText;
    const itunesURL = document.querySelector(
      'div[class="button itunes_button"] > a'
    ).href;
    const podcastiTunesID = itunesURL.slice(
      itunesURL.indexOf('/id') + 3,
      itunesURL.indexOf('?') > itunesURL.indexOf('/id') + 3
        ? itunesURL.indexOf('?')
        : itunesURL.length
    );
    const mp3URLString = document.querySelector('audio[id="audio_player"]').src;
    const mp3URL = mp3URLString.slice(
      0,
      mp3URLString.indexOf('?') > 0
        ? mp3URLString.indexOf('?')
        : mp3URLString.length
    );
    // const ratingCount = document.querySelector('span[itemprop="ratingCount"]')
    //   .innerText;
    /* Returning an object filled with the scraped data */
    return {
      podcastiTunesID,
      description,
      mp3URL
    };
  });
  /* Outputting what we scraped */
  console.log(data);
  await browser.close();
})();
