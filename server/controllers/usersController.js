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
const tokenData = require('../data/tokenData');

function sendToken(user, callback) {
  tokenData.createToken(
    {
      _userId: user._id,
      token: crypto.randomBytes(16).toString('hex')
    },
    // eslint-disable-next-line no-shadow
    (err, token) => {
      if (err) {
        logger.error(err);
        callback(err);
        return;
      }
      // and send the email
      mail.sendWithTemplate(
        'signupToken', // template
        'Echopig <token@echopig.com>', // from
        user, // to
        { user, token: token.token }, // variables for mail template
        // eslint-disable-next-line no-shadow
        err => {
          if (err) {
            logger.error(err);
            callback(err);
          }
          callback(null, user);
        }
      );
    }
  );
}

function createNewUser(userData, callback) {
  const newUserData = userData;
  if (newUserData.email) {
    newUserData.normalizedEmail = validator.normalizeEmail(newUserData.email);
  }
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
    logger.info(`New registration: ${user}`);
    // if social login that didn't provide email address,
    // redirect to settings, ask for username and email
    // then send email confirmation token
    if (!user.email) {
      callback(null, user);
      return;
    }
    // if we have email address, create a verification token for this user
    // and send via email
    sendToken(user, callback);
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
    usersData.findUserByUsername(
      newUserData.username,
      (err, existingUsernamelUser) => {
        if (err) {
          logger.error(err);
          next(err);
          return;
        }
        if (existingUsernamelUser) {
          req.flash('errors', 'That username is taken. Please try again.');
          res.redirect('/register');
          return;
        }
        usersData.findUserByEmail(
          validator.normalizeEmail(newUserData.email),
          // eslint-disable-next-line no-shadow
          (err, existingEmailUser) => {
            if (err) {
              logger.error(err);
              next(err);
              return;
            }
            if (existingEmailUser) {
              req.flash(
                'errors',
                'There is already an account with that email address. Please login or use a new email.'
              );
              res.redirect('/login');
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
              req.flash(
                'info',
                `Please verify your account by clicking the link in the email sent to ${
                  user.email
                }`
              );
              res.redirect('/');
            });
          }
        );
      }
    );
  },
  getConfirmation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('/');
      return;
    }
    // check if token matches
    tokenData.findToken(req.params.token, (err, token) => {
      if (err) {
        logger.error(err);
        next(err);
        return;
      }
      if (!token) {
        req.flash(
          'That token has expired. Please enter your email and we will send another.'
        );
        res.redirect('/resend');
        return;
      }
      // eslint-disable-next-line no-shadow
      usersData.findUserByIdWithPosts(token._userId, (err, user) => {
        if (err) {
          logger.error(err);
          next(err);
          return;
        }
        if (!user) {
          logger.error(`no user for token: ${token} with error: ${err}`);
          req.flash('errors', 'We were unable to find a user for this token.');
          res.redirect('/register');
          return;
        }
        if (user.isVerified) {
          req.flash('info', 'Your account has been verified.');
          // eslint-disable-next-line no-shadow
          req.logIn(user, err => {
            if (err) {
              logger.error(err);
              return res.redirect('/login');
            }
            return res.redirect('/settings');
          });
          return;
        }
        logger.info(`New user confirmation: ${user}`);
        user.set('isVerified', true);
        // eslint-disable-next-line no-shadow
        user.save(err => {
          if (err) {
            logger.error(err);
            next(err);
            return;
          }
          // add new user to mailing list
          // eslint-disable-next-line no-shadow
          mail.addToList(user, 'users', err => {
            if (err) logger.error(err);
          });
          // send welcome email
          mail.sendWithTemplate(
            'welcome', // template
            'Echopig <welcome@echopig.com>', // from
            user, // to
            { user }, // variables for mail template
            // eslint-disable-next-line no-shadow
            err => {
              if (err) logger.error(err);
            }
          );

          // eslint-disable-next-line no-shadow
          req.logIn(user, err => {
            if (err) {
              logger.error(err);
              next(err);
              return;
            }
            req.flash('info', 'Your account has been verified. Thank you.');
            res.redirect('/settings');
          });
        });
      });
    });
  },
  getResend(req, res, next) {
    if (req.isAuthenticated() && req.user.isVerified) {
      req.flash('info', 'Your email is verified. Thank you.');
      res.redirect('/');
      return;
    }
    res.render('users/resend', {
      csrfToken: req.csrfToken(),
      currentUser: req.user
    });
  },
  postResendToken(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach(e => {
        req.flash('errors', e.msg);
      });
      res.redirect('/resend');
    }
    usersData.findUserByEmail(
      validator.normalizeEmail(req.body.email),
      (err, user) => {
        if (err) {
          logger.error(err);
          next(err);
          return;
        }
        if (!user) {
          req.flash(
            'info',
            'We were unable to find a user with that email address. Please try again or register for an account.'
          );
          res.redirect('/resend');
          return;
        }
        // Create a new verification token for this user
        tokenData.createToken(
          {
            _userId: user._id,
            token: crypto.randomBytes(16).toString('hex')
          },
          // eslint-disable-next-line no-shadow
          (err, token) => {
            if (err) {
              logger.error(err);
              next(err);
              return;
            }
            // send the email
            mail.sendWithTemplate(
              'signupToken', // template
              'Echopig <token@echopig.com>', // from
              user, // to
              { user, token: token.token }, // variables for mail template
              // eslint-disable-next-line no-shadow
              err => {
                if (err) {
                  logger.error(err);
                  req.flash(
                    'errors',
                    'We were unable to send the email. Please try again.'
                  );
                  res.redirect('/resend');
                  return;
                }
                req.flash(
                  'info',
                  `Please verify your account by clicking the link in the email sent to ${
                    user.email
                  }`
                );
                res.redirect('/');
              }
            );
          }
        );
      }
    );
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
    crypto.randomBytes(16, (err, buf) => {
      if (err) {
        logger.error(err);
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
            logger.error(err);
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
          logger.info(
            `Setting passwordResetToken for ${user.id} / ${user.username}`
          );
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
              err => {
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
      logger.info(`Setting new password for ${user.id} / ${user.username}`);
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
    } else if (req.user.email && !req.user.isVerified) {
      logger.debug(req.user.email);
      req.flash(
        'info',
        `Please verify your email address by clicking the link in the email we sent you. If you need a new email, please enter your address below.`
      );
      res.redirect('/resend');
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
      res.redirect('/settings');
      return;
    }
    const settingsData = req.body;

    if (settingsData.email) {
      usersData.findUserByEmail(
        validator.normalizeEmail(settingsData.email),
        (err, existingUser) => {
          if (err) {
            logger.error(err);
            next(err);
            return;
          }
          if (existingUser) {
            req.flash(
              'errors',
              'There is already an account with that email address. Please login or use a new email.'
            );
            res.redirect('/settings');
          } else if (!settingsData.username) {
            usersData.updateUser(
              req.user,
              {
                email: settingsData.email,
                normalizedEmail: validator.normalizeEmail(settingsData.email)
              },
              // eslint-disable-next-line no-shadow
              err => {
                if (err) {
                  logger.error(err);
                  next(err);
                }
                req.flash('info', 'Email saved.');
                // eslint-disable-next-line no-shadow
                sendToken(req.user, err => {
                  if (err) {
                    logger.error(err);
                    next(err);
                  }
                  logger.debug(`token sent`);
                  res.redirect('/settings');
                });
              }
            );
          } else {
            usersData.findUserByUsername(
              settingsData.username,
              // eslint-disable-next-line no-shadow
              (err, existingUser) => {
                if (err) {
                  logger.error(err);
                  next(err);
                  return;
                }
                if (existingUser) {
                  req.flash(
                    'error',
                    'That username is taken. Please try again.'
                  );
                  res.redirect('/settings');
                } else {
                  usersData.updateUser(
                    req.user,
                    {
                      email: settingsData.email,
                      normalizedEmail: validator.normalizeEmail(
                        settingsData.email
                      ),
                      username: settingsData.username,
                      normalizedUsername: settingsData.username.toLowerCase()
                    },
                    // eslint-disable-next-line no-shadow
                    err => {
                      if (err) {
                        logger.error(err);
                        next(err);
                        return;
                      }
                      req.flash('info', 'Username and email saved.');
                      sendToken(
                        {
                          _id: req.user._id,
                          name: req.user.name || '',
                          email: settingsData.email
                        },
                        // eslint-disable-next-line no-shadow
                        err => {
                          if (err) {
                            logger.error(err);
                            next(err);
                            return;
                          }
                          logger.debug(`token sent`);
                          res.redirect('/settings');
                        }
                      );
                    }
                  );
                }
              }
            );
          }
        }
      );
    } else if (settingsData.username) {
      usersData.findUserByUsername(
        settingsData.username,
        (err, existingUser) => {
          if (err) {
            logger.error(err);
            next(err);
            return;
          }
          if (existingUser) {
            req.flash('errors', 'That username is taken. Please try again.');
            res.redirect('/settings');
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
              req.flash('info', 'Username saved.');
              res.redirect('/settings');
            }
          );
        }
      );
    } else {
      req.flash('errors', 'Something went wrong.');
      res.redirect('/settings');
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
