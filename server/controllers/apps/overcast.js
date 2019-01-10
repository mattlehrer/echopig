module.exports = data => {
  const re = new RegExp('(http.*)(?=" type="audio/)');
  const mp3URLarray = data.toString('utf8').match(re);
  // console.log(mp3URLarray);
  if (mp3URLarray !== null) {
    // console.log(`mp3 URL: ${mp3URLarray[0]}`);
    return mp3URLarray[0];
  }
  // console.log('no mp3 URL found');
  throw new Error('no mp3 URL found');
};
