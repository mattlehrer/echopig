/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const validator = require('validator');
const shortid = require('shortid');
const vCard = require('vcards-js');

const logger = require('../utilities/logger')(__filename);
const mail = require('../utilities/email');
const usersData = require('../data/usersData');
const reservedNames = require('../utilities/reservedNames').reserved;

function createNewUser(userData, callback) {
  const newUserData = userData;
  newUserData.normalizedEmail = validator.normalizeEmail(newUserData.email);
  // skip username if social login signup
  if (newUserData.username !== undefined)
    newUserData.normalizedUsername = newUserData.username.toLowerCase();
  // create secret email tag for posting
  newUserData.postTag = shortid.generate();
  usersData.createUser(newUserData, (err, user) => {
    if (err) {
      logger.error(err);
      callback(err);
      return;
    }

    // add new user to mailing list
    // eslint-disable-next-line no-shadow
    mail.addToList(user, 'users', err => {
      if (err) logger.error(err);
    });

    // send welcome message
    let toAddress;
    if (user.name) toAddress = `${user.name} <${user.email}>`;
    else toAddress = user.email;
    const msg = {
      from: 'Echopig <welcome@echopig.com>',
      to: toAddress,
      subject: 'Welcome to Echopig',
      text: `Welcome to Echopig. We're happy to have you. Please add post+${
        user.postTag
      }@echopig.com to your contacts so that you can add your favorite podcast episodes from the share sheet in your podcast app.`
    };
    // eslint-disable-next-line no-shadow
    mail.send(msg, err => {
      if (err) logger.error(err);
    });

    callback(null, user);
  });
}

module.exports = {
  getRegister(req, res, next) {
    if (req.user) {
      res.redirect('/');
    } else {
      res.render('users/register', { csrfToken: req.csrfToken() });
    }
  },
  createUser(userData, callback) {
    createNewUser(userData, callback);
  },
  createLocalUser(req, res, next) {
    const newUserData = req.body;
    if (!validator.isAlphanumeric(newUserData.username)) {
      req.session.error =
        'Please enter a username using only letters and numbers.';
      res.redirect('/register');
    } else if (validator.isIn(newUserData.username, reservedNames)) {
      req.session.error = 'That username is unavailable. Please try again.';
      res.redirect('/register');
    } else if (newUserData.password !== newUserData.confirmPassword) {
      req.session.error = 'Passwords do not match. Please try again.';
      res.redirect('/register');
    } else if (!validator.isEmail(newUserData.email)) {
      req.session.error = 'Please enter a valid email address.';
      res.redirect('/register');
    } else {
      usersData.findUserByUsername(newUserData.username, (err, user) => {
        if (err) {
          logger.error(err);
          next(err);
          return;
        }
        if (user) {
          req.session.error = 'That username is taken. Please try again.';
          res.redirect('/register');
          return;
        }

        // eslint-disable-next-line no-shadow
        createNewUser(newUserData, (err, user) => {
          if (err) {
            logger.error(err);
            next(err);
            return;
          }
          logger.debug(`Created user: ${user}`);

          // eslint-disable-next-line no-shadow
          req.logIn(user, err => {
            if (err) {
              res.status(400);
              res.send({ reason: err.toString() });
              return;
            }
            res.render('users/settings', { currentUser: user });
          });
        });
      });
    }
  },
  updateUser(req, res, next) {
    if (req.user._id === req.body._id || req.user.roles.indexOf('admin') > -1) {
      const updatedUserData = req.body;
      if (updatedUserData.password !== updatedUserData.confirmPassword) {
        req.session.error = 'Passwords do not match!';
        res.redirect('/settings');
      } else {
        usersData.updateUser(
          { _id: req.body._id },
          updatedUserData,
          (err, user) => {
            res.redirect('/settings');
          }
        );
      }
    } else {
      res.send({ reason: 'You do not have permissions!' });
    }
  },
  getLogin(req, res, next) {
    if (req.user) {
      res.redirect('/');
    } else {
      res.render('users/login', { csrfToken: req.csrfToken() });
    }
  },
  getSettings(req, res, next) {
    if (!req.user) {
      res.redirect('/');
    } else {
      res.render('users/settings', {
        currentUser: req.user,
        csrfToken: req.csrfToken()
      });
    }
  },
  postSettings(req, res, next) {
    const settingsData = req.body;
    if (!validator.isAlphanumeric(settingsData.username)) {
      req.session.error =
        'Please enter a username using only letters and numbers.';
      res.redirect('/settings');
    } else if (validator.isIn(settingsData.username, reservedNames)) {
      req.session.error = 'That username is unavailable. Please try again.';
      res.redirect('/settings');
    }
    usersData.findUserByUsername(settingsData.username, (err, existingUser) => {
      if (err) {
        logger.error(err);
        next(err);
        return;
      }
      if (existingUser) {
        req.session.error = 'That username is taken. Please try again.';
        res.redirect('/register');
        return;
      }
      usersData.updateUser(
        req.user,
        {
          username: settingsData.username,
          normalizedUsername: settingsData.username.toLowerCase()
        },
        // eslint-disable-next-line no-shadow
        err => {
          if (err) {
            logger.error(err);
            next(err);
          }
          res.redirect('/settings');
        }
      );
    });
  },
  getVcard(req, res, next) {
    if (!req.user) {
      res.redirect('/');
    } else {
      const postVCard = vCard();

      // set properties
      postVCard.firstName = 'Post To';
      postVCard.lastName = 'Echopig';
      postVCard.organization = 'Echopig';
      postVCard.url = 'http://www.echopig.com';
      postVCard.email = `post+${req.user.postTag}@echopig.com`;
      // postVCard.photo.attachFromUrl('/android-chrome-256x256.png');

      // set content-type and disposition including desired filename
      res.set('Content-Type', 'text/vcard; name="echopig.vcf"');
      res.set('Content-Disposition', 'inline; filename="echopig.vcf"');

      // send the response
      res.send(postVCard.getFormattedString());
    }
  },
  findUserByTag(tag, callback) {
    usersData.findUserByTag(tag, callback);
  },
  findUserByIdWithPosts(id, callback) {
    usersData.findUserByIdWithPosts(id, callback);
  },
  addPostByUser(post, user, callback) {
    if (
      !user.explicit &&
      String(post.episode.podcast.contentAdvisoryRating).toLowerCase() ===
        'explicit'
    ) {
      user.set({ explicit: true });
      user.save((err, updatedUser) => {
        if (err) logger.error(err);
        else
          logger.debug(`set explicit to true for user ${updatedUser.username}`);
      });
    }
    usersData.addPostByUser(post, user, callback);
  },
  removePostByUser(post, user, callback) {
    usersData.removePostByUser(post, user, callback);
  }
};
