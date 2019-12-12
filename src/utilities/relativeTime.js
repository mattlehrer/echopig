// based on moment-twitter
const moment = require('moment');

const second = 1e3;
const minute = 6e4;
const hour = 36e5;
const day = 864e5;
const week = 6048e5;
const year = 31536e6;
const formats = {
  seconds: {
    short: 's',
    long: ' second',
  },
  minutes: {
    short: 'm',
    long: ' minute',
  },
  hours: {
    short: 'h',
    long: ' hour',
  },
  days: {
    short: 'd',
    long: ' day',
  },
};

module.exports = (date, format = 'long') => {
  let unitStr;
  const diff = Math.abs(moment(date).diff());
  let unit = null;
  let num = null;
  if (diff <= second) {
    unit = 'seconds';
    num = 1;
  } else if (diff < minute) {
    unit = 'seconds';
  } else if (diff < hour) {
    unit = 'minutes';
  } else if (diff < day) {
    unit = 'hours';
  } else if (format === 'short') {
    if (diff < week) {
      unit = 'days';
    } else {
      return moment(date).format('M/D/YY');
    }
  } else if (diff < year) {
    return moment(date).format('MMM D');
  } else {
    return moment(date).format('M/D/YY');
  }
  if (!(num && unit)) {
    // eslint-disable-next-line security/detect-object-injection
    num = moment.duration(diff)[unit]();
  }
  // eslint-disable-next-line security/detect-object-injection
  unitStr = formats[unit][format];
  if (format === 'long' && num > 1) {
    unitStr += 's';
  }
  return `${num + unitStr} ago`;
};
