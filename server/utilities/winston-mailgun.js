const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const testMode = !(process.env.NODE_ENV === 'production');
const mailgun = require('mailgun-js')({ apiKey, domain, testMode });
const util = require('util');
const os = require('os');
const Transport = require('winston-transport');

module.exports = class Mailgun extends Transport {
  constructor(opts) {
    super(opts);

    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail,
    //   logentries, etc.).
    //

    this.name = opts.name || 'mail';
    this.to = opts.to;
    this.from = opts.from || `winston@${os.hostname()}`;
    this.level = opts.level || 'info';
    this.silent = opts.silent || false;
    this.filter = opts.filter || false;
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const msgOptions = {
      from: this.from,
      to: this.to,
      subject: `[Echopig ${info.level}] ${info.message.split('\n')[0]}`,
      text: info.message
    };
    // Perform the writing to the remote service
    mailgun.messages().send(msgOptions, err => {
      if (err) {
        callback(err);
      }
    });
    callback();
  }
};
