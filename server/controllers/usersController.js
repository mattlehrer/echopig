/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const validator = require('validator');
const nanoid = require('nanoid');
const vCard = require('vcards-js');

const logger = require('../utilities/logger')(__filename);
const encryption = require('../utilities/cripto');
const usersData = require('../data/usersData');
const reservedNames = require('../utilities/reservedNames').reserved;

module.exports = {
  getRegister(req, res, next) {
    if (req.user) {
      res.redirect('/');
    } else {
      res.render('users/register', { csrfToken: req.csrfToken() });
    }
  },
  createUser(req, res, next) {
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
      newUserData.salt = encryption.generateSalt();
      newUserData.hashPass = encryption.generateHashedPassword(
        newUserData.salt,
        newUserData.password
      );
      newUserData.normalizedEmail = validator.normalizeEmail(newUserData.email);
      newUserData.normalizedUsername = newUserData.username.toLowerCase();
      // create secret email tag for posting
      newUserData.postTag = nanoid(15);
      usersData.createUser(newUserData, (err, user) => {
        if (err) {
          logger.error(`${err.name}: ${err.errmsg}`);
          req.session.error = 'That username is taken. Please try again.';
          res.redirect('/register');
          return;
        }

        // TODO add new user to mailgun mailing list
        // TODO send welcome email

        // eslint-disable-next-line consistent-return, no-shadow
        req.logIn(user, err => {
          if (err) {
            res.status(400);
            return res.send({ reason: err.toString() });
          }
          res.redirect('/');
        });
      });
    }
  },
  updateUser(req, res, next) {
    if (req.user._id === req.body._id || req.user.roles.indexOf('admin') > -1) {
      const updatedUserData = req.body;
      if (updatedUserData.password && updatedUserData.password.length > 0) {
        updatedUserData.salt = encryption.generateSalt();
        updatedUserData.hashPass = encryption.generateHashedPassword(
          updatedUserData.salt,
          updatedUserData.password
        );
      }

      if (updatedUserData.password !== updatedUserData.confirmPassword) {
        req.session.error = 'Passwords do not match!';
        res.redirect('/profile');
      } else {
        usersData.updateUser(
          { _id: req.body._id },
          updatedUserData,
          (err, user) => {
            res.redirect('/profile');
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
        currentUser: req.user
      });
    }
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
    usersData.addPostByUser(post, user, callback);
  },
  removePostByUser(post, user, callback) {
    usersData.removePostByUser(post, user, callback);
  }
};
