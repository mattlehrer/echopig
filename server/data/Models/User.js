const mongoose = require('mongoose');
const encryption = require('../../utilities/cripto');

module.exports.init = () => {
  const userSchema = new mongoose.Schema({
    username: { type: String, require: '{PATH} is required', unique: true },
    normalizedUsername: { type: String, unique: true },
    salt: String,
    hashPass: String,
    email: String,
    normalizedEmail: { type: String, unique: true },
    postTag: { type: String, unique: true },
    signupTime: Date,
    roles: [String]
  });

  userSchema.method({
    authenticate(password) {
      return encryption.compareHashedPasswords(password, this.hashPass);
    }
  });

  // eslint-disable-next-line no-unused-vars
  const User = mongoose.model('User', userSchema);
};
