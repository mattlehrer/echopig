/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const validator = require('validator');
const shortid = require('shortid');
const vCard = require('vcards-js');
const crypto = require('crypto');
const { validationResult } = require('express-validator/check');

const logger = require('../utilities/logger')(__filename);
const mail = require('../utilities/email');
const usersData = require('../data/usersData');
// const reservedNames = require('../utilities/reservedNames').reserved;

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

    mail.sendWithTemplate(
      'welcome', // template
      'Echopig <welcome@echopig.com>', // from
      user, // to
      { user }, // variables for mail template
      // eslint-disable-next-line no-shadow
      err => {
        logger.error(err);
        callback(err);
      }
    );

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('back');
      return;
    }
    const newUserData = req.body;
    usersData.findUserByUsername(newUserData.username, (err, user) => {
      if (err) {
        logger.error(err);
        next(err);
        return;
      }
      if (user) {
        req.flash('errors', 'That username is taken. Please try again.');
        res.redirect('/register');
        return;
      }
      // TODO: ensure email is unique

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
          res.redirect('/settings');
        });
      });
    });
    // }
  },
  updateUser(req, res, next) {
    if (req.user._id === req.body._id || req.user.roles.indexOf('admin') > -1) {
      const updatedUserData = req.body;
      if (updatedUserData.password !== updatedUserData.confirmPassword) {
        req.flash('errors', 'Passwords do not match!');
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
  getForgot(req, res, next) {
    if (req.isAuthenticated()) {
      res.redirect('/settings');
      return;
    }
    res.render('users/forgot', {
      title: 'Forgot Password',
      csrfToken: req.csrfToken()
    });
  },
  postForgot(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('back');
      return;
    }
    // create token
    crypto.randomBytes(20, (err, buf) => {
      if (err) {
        next(err);
        return;
      }
      const token = buf.toString('hex');
      // set token
      usersData.findUserByEmail(
        validator.normalizeEmail(req.body.email),
        // eslint-disable-next-line no-shadow
        (err, user) => {
          if (err) {
            next(err);
            return;
          }
          if (!user) {
            req.flash(
              'errors',
              'An account with that email address does not exist.'
            );
            res.redirect('/forgot');
            return;
          }
          user.set('passwordResetToken', token);
          user.set('passwordResetExpires', Date.now() + 3600000); // 1 hour
          // eslint-disable-next-line no-shadow
          user.save((err, updatedUser) => {
            if (err) {
              logger.error(err);
              next(err);
              return;
            }
            if (!updatedUser) {
              req.flash(
                'errors',
                'Account with that email address does not exist.'
              );
              res.redirect('/forgot');
              return;
            }
            // send email
            mail.sendWithTemplate(
              'forgotPassword', // template
              'Echopig <passwordreset@echopig.com>', // from
              user, // to
              { token, BASE_URL: process.env.BASE_URL }, // variables for mail template
              // eslint-disable-next-line no-shadow
              (err, response) => {
                if (err) {
                  logger.error(err);
                  next(err);
                  return;
                }
                req.flash(
                  'info',
                  `An e-mail has been sent to ${
                    updatedUser.email
                  } with further instructions.`
                );
                res.redirect('/login');
              }
            );
          });
        }
      );
    });
  },
  getReset(req, res, next) {
    if (req.isAuthenticated()) {
      res.redirect('/');
      return;
    }
    const { token } = req.params;
    usersData.findResetToken(token, (err, user) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        req.flash('errors', 'Password reset token is invalid or has expired.');
        res.redirect('/forgot');
        return;
      }
      res.render('users/reset', { csrfToken: req.csrfToken() });
    });
  },
  postReset(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('back');
      return;
    }
    const { token } = req.params;
    usersData.findResetToken(token, (err, user) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        req.flash('errors', 'Password reset token is invalid or has expired.');
        res.redirect('/forgot');
        return;
      }
      user.set('password', req.body.password);
      user.set('passwordResetToken', undefined);
      user.set('passwordResetExpires', undefined);
      // eslint-disable-next-line no-shadow
      user.save((err, updatedUser) => {
        if (err) {
          logger.error(err);
          next(err);
          return;
        }
        if (!updatedUser) {
          req.flash(
            'errors',
            'Account with that email address does not exist.'
          );
          res.redirect('/forgot');
          return;
        }
        // send email
        mail.sendWithTemplate(
          'passwordHasBeenReset', // template
          'Echopig <passwordreset@echopig.com>', // from
          user, // to
          { user }, // variables for mail template
          // eslint-disable-next-line no-shadow
          (err, response) => {
            if (err) {
              logger.error(err);
              next(err);
              return;
            }
            logger.debug(response);
            req.flash('info', 'Your password has been changed.');
            res.redirect('/login');
          }
        );
      });
    });
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('back');
      return;
    }
    const settingsData = req.body;
    usersData.findUserByUsername(settingsData.username, (err, existingUser) => {
      if (err) {
        logger.error(err);
        next(err);
        return;
      }
      if (existingUser) {
        req.flash('error', 'That username is taken. Please try again.');
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
    let rating;
    try {
      rating = post.episode.podcast.contentAdvisoryRating;
    } catch (err) {
      rating = '';
    }
    if (!user.explicit && String(rating).toLowerCase() === 'explicit') {
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
