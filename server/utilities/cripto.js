const crypto = require('bcrypt');

const saltRounds = 10;

module.exports = {
  generateSalt() {
    return crypto.genSaltSync(saltRounds);
  },
  generateHashedPassword(salt, pwd) {
    return crypto.hashSync(pwd, salt);
  },
  compareHashedPasswords(plainText, hash) {
    return crypto.compareSync(plainText, hash);
  }
};
