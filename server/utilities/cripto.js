const crypto = require('bcrypt');

const saltRounds = 10;

module.exports = {
  async generateSalt() {
    return crypto.genSalt(saltRounds);
  },
  async generateHashedPassword(salt, pwd) {
    return crypto.hash(pwd, salt);
  },
  async compareHashedPasswords(plainText, hash) {
    return crypto.compare(plainText, hash);
  }
};
