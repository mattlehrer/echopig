const mongoose = require('mongoose');

const Token = mongoose.model('Token');

module.exports = {
  createToken(token, callback) {
    Token.create(token, callback);
  },

  deleteToken(token, callback) {
    Token.deleteOne(token, callback);
  },

  findToken(token, callback) {
    Token.findOne({ token }, callback);
  }
};
