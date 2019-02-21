const apiKey = process.env.MAILGUN_API_KEY;
const domain = process.env.MAILGUN_DOMAIN;
const testMode = !(process.env.NODE_ENV === 'production');
const mailgun = require('mailgun-js')({ apiKey, domain, testMode });
const appRoot = require('app-root-path');
const nodemailer = require('nodemailer');
const Email = require('email-templates');
const mg = require('nodemailer-mailgun-transport');

const logger = require('../utilities/logger')(__filename);

const auth = {
  auth: {
    api_key: apiKey,
    domain
  }
};

module.exports = {
  send(data, callback) {
    // const data = {
    //   from: 'Excited User <me@samples.mailgun.org>',
    //   to: 'serobnic@mail.ru',
    //   subject: 'Hello',
    //   text: 'Testing some Mailgun awesomeness!'
    // };
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
      name: user.name || '',
      upsert: 'yes'
    };

    list.members().create(member, (err, data) => {
      if (err) {
        logger.error(err);
        callback(err);
        return;
      }
      logger.debug(`added to list: ${data}`);
      callback(null);
    });
  },
  confirmSignature(token = '', timestamp = '', signature = '') {
    return mailgun.validateWebhook(timestamp, token, signature);
  },
  transport: nodemailer.createTransport(mg(auth)),
  sendWithTemplate(
    template,
    from = `info@${domain}`,
    to,
    variables = {},
    callback
  ) {
    const email = new Email({
      message: {
        from
      },
      // uncomment below to send emails in development/test env:
      // send: true,
      transport: this.transport
    });
    const locals = variables;
    locals.BASE_URL = process.env.BASE_URL;

    email
      .send({
        template: `${appRoot}/server/views/emails/${template}`,
        message: {
          to: { name: `${to.name || ''}`, address: to.email },
          // mailgun tag for email analytics
          'o:tag': [`${template}`]
        },
        locals
      })
      .then(res => {
        logger.debug(res);
        callback(null, res);
      })
      .catch(err => {
        logger.error(err);
        callback(err);
      });
  }
};
