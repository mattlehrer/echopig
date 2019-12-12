/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
// const logger = require('../utilities/logger')(__filename);

const Save = mongoose.model('Save');

module.exports = {
  addNewSave(save, callback) {
    Save.create(save, callback);
  },

  updateSave(save, query, callback) {
    Save.findOneAndUpdate({ _id: save.id || save }, query, callback);
  },

  deleteSave(query, callback) {
    Save.findOneAndDelete(query, callback);
  },

  // returns a sorted array of objects with _id of episode and numberOfSaves after since
  findMostSavedEpisodesInTimeframe(since, maxEpisodes, callback) {
    Save.aggregate([
      { $match: { updatedAt: { $gte: since } } },
      { $sortByCount: '$episode' },
      { $limit: maxEpisodes },
      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: '_id',
          as: 'episode',
        },
      },
      { $unwind: '$episode' },
      {
        $lookup: {
          from: 'podcasts',
          localField: 'episode.podcast',
          foreignField: '_id',
          as: 'episode.podcast',
        },
      },
      { $unwind: '$episode.podcast' },
    ]).exec((err, episodes) => {
      if (err) callback(err, null);
      else {
        callback(
          null,
          episodes.map(e => {
            // add id property because this is returning an array of objects, not mongoose documents
            // eslint-disable-next-line no-underscore-dangle
            e.episode.id = e.episode._id;
            return e.episode;
          }),
        );
      }
    });
  },

  // returns a sorted array of objects with _id of podcasts and numberOfSaves after since
  findMostSavedPodcastsInTimeframe(since, maxPodcasts, callback) {
    Save.aggregate([
      { $match: { updatedAt: { $gte: since } } },
      {
        $lookup: {
          from: 'episodes',
          localField: 'episode',
          foreignField: '_id',
          as: 'episode',
        },
      },
      { $unwind: '$episode' },
      {
        $lookup: {
          from: 'podcasts',
          localField: 'episode.podcast',
          foreignField: '_id',
          as: 'episode.podcast',
        },
      },
      { $unwind: '$episode.podcast' },
      { $sortByCount: '$episode.podcast' },
      { $limit: maxPodcasts },
    ]).exec((err, podcasts) => {
      if (err) callback(err, null);
      else {
        callback(
          null,
          podcasts.map(e => {
            e._id.saves = e.count;
            return e._id;
          }),
        );
      }
    });
  },

  // returns a sorted array of objects with _id of episode and numberOfSaves after since
  findMostSavedEpisodesInGenreInTimeframe(genre, since, maxEpisodes, callback) {
    Save.aggregate([
      { $match: { updatedAt: { $gte: since } } },
      { $sortByCount: '$episode' },
      {
        $lookup: {
          from: 'episodes',
          localField: '_id',
          foreignField: '_id',
          as: 'episode',
        },
      },
      { $unwind: '$episode' },
      {
        $lookup: {
          from: 'podcasts',
          localField: 'episode.podcast',
          foreignField: '_id',
          as: 'episode.podcast',
        },
      },
      { $unwind: '$episode.podcast' },
      { $unwind: '$episode.podcast.genres' },
      // do a case insensitive search for genre
      {
        $match: {
          'episode.podcast.genres': { $regex: `^${genre}$`, $options: 'i' },
        },
      },
      { $limit: maxEpisodes },
    ]).exec((err, episodes) => {
      if (err) callback(err, null);
      else
        callback(
          null,
          episodes.map(e => {
            // add id property because this is returning an array of objects, not mongoose documents
            // eslint-disable-next-line no-underscore-dangle
            e.episode.id = e.episode._id;
            return e.episode;
          }),
        );
    });
  },
};
