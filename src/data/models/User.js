const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

module.exports.init = () => {
  const userSchema = new mongoose.Schema(
    {
      username: { type: String, unique: true },
      normalizedUsername: { type: String, unique: true },
      password: String,
      isVerified: { type: Boolean, default: false },
      passwordResetToken: String,
      passwordResetExpires: Date,

      name: String,
      email: String,
      normalizedEmail: { type: String, unique: true },
      postTag: { type: String, unique: true },
      saveForLaterId: { type: String, unique: true },
      avatar: String,
      posts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Post',
          default: [],
        },
      ],
      saves: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Save',
          default: [],
        },
      ],
      explicit: { type: Boolean, default: false },
      roles: [String],

      facebook: String,
      twitter: String,
      tokens: Array,
    },
    {
      timestamps: true,
    },
  );

  /**
   * Password hash middleware.
   */
  userSchema.pre('save', function save(next) {
    const user = this;
    if (!user.isModified('password')) {
      next();
      return;
    }
    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        next(err);
        return;
      }
      // eslint-disable-next-line no-shadow
      bcrypt.hash(user.password, salt, (err, hash) => {
        if (err) {
          next(err);
          return;
        }
        user.password = hash;
        next();
      });
    });
  });

  /**
   * Helper method for validating user's password.
   */
  userSchema.methods.comparePassword = function comparePassword(
    candidatePassword,
    cb,
  ) {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      cb(err, isMatch);
    });
  };

  mongoose.model('User', userSchema);
};
