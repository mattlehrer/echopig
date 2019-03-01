const validator = require('validator');

module.exports = {
  cleanTimeframeQuery(query = '') {
    let s = query;
    if (typeof query === 'number') {
      s = String(query);
    }
    if (validator.isInt(s, { min: 1 })) {
      return Number(s);
    }
    return 24 * 7; // one week
  }
};
