const crypto = require('crypto');

const hmac = crypto.createHmac('sha256', process.env.MAILGUNAPIKEY);

module.exports = {
  confirmSignature(token = '', timestamp = '', signature = '', callback) {
    if (token === '' || timestamp === '' || signature === '') {
      callback(null, false);
    } else {
      // TODO: cache tokens and callback(null, false) on reused token
      //  https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
      hmac.update(`${timestamp}${token}`);
      const digest = hmac.digest('hex');
      callback(null, signature === digest);
    }
  }
};
