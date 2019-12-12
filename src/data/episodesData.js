const mongoose = require('mongoose');

const Episode = mongoose.model('Episode');

module.exports = {
  addNewEpisode(episode, callback) {
    Episode.create(episode, callback);
  },

  updateEpisode(query, episode, callback) {
    Episode.update(query, episode, callback);
  },

  deleteEpisode(query, episode, callback) {
    Episode.deleteOne(query, episode, callback);
  },

  findEpisodeById(id, callback) {
    Episode.findById(id, callback);
  },

  findEpisodeByShareURL(shareURL, callback) {
    Episode.findOne({ shareURLs: shareURL }, callback);
  },

  findEpisodeBymp3URL(mp3URL, callback) {
    Episode.findOne({ mp3URL }, callback);
  },

  addPostOfEpisode(post, episode, callback) {
    Episode.findByIdAndUpdate(
      { _id: episode.id },
      { $push: { posts: post } },
      callback,
    );
  },

  removePostOfEpisode(postId, callback) {
    const objId = mongoose.Types.ObjectId(postId);
    Episode.findOneAndUpdate(
      { posts: objId },
      { $pull: { posts: objId } },
      callback,
    );
  },

  addSaveOfEpisode(save, episode, callback) {
    Episode.findByIdAndUpdate(
      { _id: episode.id },
      { $push: { saves: save } },
      callback,
    );
  },

  removeSaveOfEpisode(saveId, callback) {
    const objId = mongoose.Types.ObjectId(saveId);
    Episode.findOneAndUpdate(
      { saves: objId },
      { $pull: { saves: objId } },
      callback,
    );
  },

  addShareURLtoEpisode(shareURL, episode, callback) {
    Episode.findByIdAndUpdate(
      { _id: episode.id },
      { $push: { shareURLs: shareURL } },
      callback,
    );
  },

  findAllEpisodesOfPodcast(podcast, callback) {
    Episode.aggregate([
      // match by podcast id
      { $match: { podcast: mongoose.Types.ObjectId(podcast.id) } },
      // in order to sort by number of posts in the posts array,
      // we have to add a field for its length
      { $addFields: { numberOfPosts: { $size: '$posts' } } },
      { $sort: { numberOfPosts: -1 } },
    ]).exec((err, episodes) => {
      if (err) callback(err, null);
      else
        callback(
          null,
          episodes.map(e => {
            // add id property because this is returning an array of objects, not mongoose documents
            // eslint-disable-next-line no-underscore-dangle
            e.id = e._id;
            return e;
          }),
        );
    });
  },
};
