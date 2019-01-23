const mongoose = require('mongoose');
const autopopulate = require('mongoose-autopopulate');

module.exports.init = () => {
  const postSchema = new mongoose.Schema(
    {
      byUser: { type: 'ObjectId', ref: 'User' },
      email: {
        fromAddress: String,
        subject: String,
        bodyHTML: String,
        bodyPlainText: String
      },
      shareURL: String,
      comment: String,
      episode: {
        type: 'ObjectId',
        ref: 'Episode',
        autopopulate: true
      },
      guid: String
    },
    {
      timestamps: true
    }
  );

  postSchema.plugin(autopopulate);

  // eslint-disable-next-line no-unused-vars
  const Post = mongoose.model('Post', postSchema);
};
