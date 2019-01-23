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

  let regex = new RegExp(/(?:"canonical" href\S*\?i=)(\d+)/m);
  let resultArray = regex.exec(html);
  if (resultArray === null) {
    throw new Error('no episode ID found');
  }
  const episodeID = resultArray[1];

  // capture episode info = row in table of episodes
  regex = new RegExp(`<tr .*adam-id="${episodeID}" [\\s\\S]*?</tr>`, 'm');
  resultArray = regex.exec(html);
  if (resultArray === null) {
    throw new Error('Episode info not found');
  }
  const episodeRow = resultArray[0];

  // find Podcast title
  regex = new RegExp(/(?:preview-album=")(.*?)(?:")/m);
  resultArray = regex.exec(html);
  if (resultArray !== null) {
    [, episodeData.podcastTitle] = resultArray;
  }

  // find Podcast iTunesID
  regex = new RegExp(/(?:\/itunes)(\d*)(?:\/)/m);
  resultArray = regex.exec(html);
  if (resultArray === null) {
    throw new Error('no podcast title found');
  }
  [, episodeData.podcastiTunesID] = resultArray;

  // find Podcast Author
  regex = new RegExp(/(?:preview-artist=")(.*?)(?:")/m);
  resultArray = regex.exec(html);
  if (resultArray !== null) {
    [, episodeData.podcastAuthor] = resultArray;
  }

  // find Podcast artwork
  regex = new RegExp(/(?:fullart" src=".*)(http.*)(?:"\/)/m);
  resultArray = regex.exec(html);
  if (resultArray !== null) {
    [, episodeData.podcastArtwork] = resultArray;
  }

  // find episode title
  regex = new RegExp(/(?:sort-value=")(.*)(?:" class="name)/m);
  resultArray = regex.exec(episodeRow);
  if (resultArray === null) {
    throw new Error('no episode title found');
  }
  [, episodeData.title] = resultArray;

  // find episode description
  regex = new RegExp(/(?:sort-value=")(.*)(?:" class="description)/m);
  resultArray = regex.exec(episodeRow);
  if (resultArray === null) {
    episodeData.description = '';
  } else {
    [, episodeData.description] = resultArray;
  }

  // find episode image
  // not exposed

  // find mp3 URL
  regex = new RegExp(
    `(?:audio-preview-url=")(.*mp3)(?:.*adam-id="${episodeID})`,
    'm'
  );
  resultArray = regex.exec(episodeRow);
  if (resultArray === null) {
    throw new Error('no mp3 URL found');
  }
  [, episodeData.mp3URL] = resultArray;

  // find episode publish date
  regex = new RegExp(/(?:")([\\d\\/]*)(?:".*?class="release-date")/m);
  resultArray = regex.exec(episodeRow);
  if (resultArray !== null) {
    episodeData.releaseDate = new Date(resultArray[0]);
  }

  // find episode duration
  regex = new RegExp(/(?:duration=")(\d*)/m);
  resultArray = regex.exec(episodeRow);
  if (resultArray === null) {
    episodeData.duration = '';
  } else {
    [, episodeData.duration] = resultArray;
  }

  // find riaa rating
  regex = new RegExp(/(?:rating-riaa=")(\d*)/m);
  resultArray = regex.exec(episodeRow);
  if (resultArray === null) {
    episodeData.ratingRiaa = '';
  } else {
    [, episodeData.ratingRiaa] = resultArray;
  }

  // find parental rating
  regex = new RegExp(/(?:parental-rating=")(\d*)/m);
  resultArray = regex.exec(episodeRow);
  if (resultArray === null) {
    episodeData.parentalRating = '';
  } else {
    [, episodeData.parentalRating] = resultArray;
  }

  cb(null, episodeData);
};
