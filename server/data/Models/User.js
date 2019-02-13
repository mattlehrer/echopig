const mongoose = require('mongoose');
const encryption = require('../../utilities/cripto');

module.exports.init = () => {
  const userSchema = new mongoose.Schema(
    {
      username: String,
      normalizedUsername: { type: String, unique: true },
      name: String,
      email: String,
      normalizedEmail: String,
      postTag: { type: String, unique: true },
      avatar: String,
      posts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
          default: []
        }
      ],
      explicit: { type: Boolean, default: false },
      roles: [String],

      salt: String,
      hashPass: String,

      facebook: String,
      twitter: String,
      tokens: Array
    },
    {
      timestamps: true
    }
  );

  userSchema.method({
    authenticate(password) {
      return encryption.compareHashedPasswords(password, this.hashPass);
    }
  });

  // eslint-disable-next-line no-unused-vars
  const User = mongoose.model('User', userSchema);
};
