const mongoose = require('mongoose');

const encryption = require('../../utilities/cripto');

module.exports.init = () => {
  const userSchema = new mongoose.Schema({
    username: { type: String, require: '{PATH} is required', unique: true },
    salt: String,
    hashPass: String,
    roles: [String]
  });

  userSchema.method({
    authenticate(password) {
      if (
        encryption.generateHashedPassword(this.salt, password) === this.hashPass
      ) {
        return true;
      }

      return false;
    }
  });

  // eslint-disable-next-line prefer-const, no-unused-vars
  let User = mongoose.model('User', userSchema);
};
