const moment = require('moment');

function relativeTime(date) {
  const relative = moment(date).fromNow();
  if (relative.includes('month') || relative.includes('year')) {
    return moment(date).format('LL');
  }
  return relative;
}

module.exports = relativeTime;
