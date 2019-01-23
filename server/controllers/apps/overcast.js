module.exports = (data, cb) => {
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

  // find Podcast title
  let regex = new RegExp(/(?: &mdash; )(.*)(?: &mdash; )/gm);
  let resultArray = regex.exec(html);
  if (resultArray !== null) {
    [, episodeData.podcastTitle] = resultArray;
  }

  // find Podcast iTunesID
  regex = new RegExp(/(?:\/itunes)(\d*)(?:\/)/gm);
  resultArray = regex.exec(html);
  if (resultArray === null) {
    throw new Error('no podcast title found');
  }
  [, episodeData.podcastiTunesID] = resultArray;

  // find Podcast artwork
  regex = new RegExp(/(?:fullart" src=".*)(http.*)(?:"\/)/gm);
  resultArray = regex.exec(html);
  if (resultArray !== null) {
    episodeData.podcastArtwork = unescape(resultArray[1]);
  }

  // find episode title
  regex = new RegExp(/(?:name="og:title" content=")(.*)(?: &mdash;)/gm);
  resultArray = regex.exec(html);
  if (resultArray === null) {
    throw new Error('no mp3 URL found');
  }
  [, episodeData.title] = resultArray;

  // find episode description
  regex = new RegExp(/(?:name="og:description" content=")(.*)(?:" \/>)/gm);
  resultArray = regex.exec(html);
  if (resultArray === null) {
    episodeData.description = '';
  } else {
    [, episodeData.description] = resultArray;
  }

  // find episode image
  // regex = new RegExp(/(?:name="og:image" content="http.*)(http.*)(?:" \/>)/gm);
  // resultArray = regex.exec(html);
  // if (resultArray === null) {
  //   episodeData.image = '';
  // } else {
  //   [, episodeData.image] = unescape(resultArray);
  // }
  // overcast always uses the main podcast image (2019-01-18)

  // find mp3 URL
  regex = new RegExp(/(?:src=")(.*mp3)(?:.*" type="audio\/mpeg)/gm);
  resultArray = regex.exec(html);
  if (resultArray === null) {
    throw new Error('no mp3 URL found');
  }
  [, episodeData.mp3URL] = resultArray;

  // find episode publish date
  regex = new RegExp(/(?:class="margintop1">\W*)(.*)(?:\W<\/div>)/m);
  resultArray = regex.exec(html);
  if (resultArray === null) {
    episodeData.releaseDate = '';
  } else {
    [, episodeData.releaseDate] = resultArray;
  }

  // find episode duration
  // not exposed

  // find rating
  // not exposed

  cb(null, episodeData);
};
