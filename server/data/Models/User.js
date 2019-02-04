const mongoose = require('mongoose');
const encryption = require('../../utilities/cripto');

module.exports.init = () => {
  const userSchema = new mongoose.Schema(
    {
      username: { type: String, require: '{PATH} is required' },
      normalizedUsername: { type: String, unique: true },
      salt: String,
      hashPass: String,
      email: String,
      normalizedEmail: String,
      postTag: { type: String, unique: true },
      posts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
          default: []
        }
      ],
      explicit: { type: Boolean, default: false },
      roles: [String]
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
