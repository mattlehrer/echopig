const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const testMode = !process.env.NODE_ENV === 'production';
const mailgun = require('mailgun-js')({ apiKey, domain, testMode });
const logger = require('../utilities/logger')(__filename);

// const data = {
//   from: 'Excited User <me@samples.mailgun.org>',
//   to: 'serobnic@mail.ru',
//   subject: 'Hello',
//   text: 'Testing some Mailgun awesomeness!'
// };

// mail.messages().send(data, (err, body) => {
//   if (err) logger.error(err);
//   logger.debug(body);
// });

module.exports = {
  send(data, callback) {
    mailgun.messages().send(data, (err, body) => {
      if (err) {
        logger.error(err);
        callback(err);
        return;
      }
      logger.debug(body);
      callback(null);
    });
  },
  addToList(user, listName, callback) {
    const list = mailgun.lists(`${listName}@${domain}`);

    const member = {
      subscribed: true,
      address: user.email,
      name: user.name || ''
    };

    list.members().create(member, (err, data) => {
      if (err) {
        logger.error(err);
        callback(err);
        return;
      }
      logger.debug(data);
      callback(null);
    });
  },
  confirmSignature(token = '', timestamp = '', signature = '') {
    return mailgun.validateWebhook(timestamp, token, signature);
  }
};
