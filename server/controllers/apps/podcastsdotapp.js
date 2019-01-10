module.exports = data => {
  const epID = data.match(/\?i=1000(\d+)/)[1];
  const re = new RegExp(`audio-preview-url="(.*mp3)".*adam-id="${epID}"`);
  const mp3URLarray = data.toString('utf8').match(re);
  if (mp3URLarray !== null) {
    return mp3URLarray[1];
  }
  // console.log('no mp3 URL found');
  throw new Error('no mp3 URL found');
};
