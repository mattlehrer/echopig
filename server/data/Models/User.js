const mongoose = require('mongoose');
const encryption = require('../../utilities/cripto');

module.exports.init = () => {
  const userSchema = new mongoose.Schema({
    username: { type: String, require: '{PATH} is required', unique: true },
    salt: String,
    hashPass: String,
    email: { type: String, unique: true },
    roles: [String]
  });

  userSchema.method({
    authenticate(password) {
      return encryption.compareHashedPasswords(password, this.hashPass);
    }
  });

  // eslint-disable-next-line prefer-const, no-unused-vars
  let User = mongoose.model('User', userSchema);
};
