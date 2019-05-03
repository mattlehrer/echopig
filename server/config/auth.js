/* eslint-disable no-unused-vars */
const passport = require('passport');
const logger = require('../utilities/logger')(__filename);

module.exports = {
  localLogin(req, res, next) {
    const auth = passport.authenticate('local', (err, user) => {
      if (err) {
        logger.error(`localLogin auth error: ${JSON.stringify(err)}`);
        if (err.message === 'data and hash arguments required') {
          req.flash(
            'errors',
            'Please login with a social login previously used.'
          );
          res.redirect('/login');
          return;
        }
        next(err);
        return;
      }
      if (!user) {
        logger.error(`login failure on username: ${req.body.username}`);
        req.flash('errors', 'Invalid username or password. Please try again.');
        res.redirect('/login');
        return;
      }
      // make sure email is verified
      if (!user.isVerified) {
        logger.info(`login but not verified: ${user.username}`);
        req.flash('errors', 'Please verify your email address.');
        res.redirect('/resend');
        return;
      }

      // eslint-disable-next-line no-shadow
      req.logIn(user, err => {
        if (err) {
          logger.error(
            `req.logIn failure on username: ${
              user.username
            } with err: ${JSON.stringify(err)}`
          );
          next(err);
          return;
        }
        logger.info(`logIn for username: ${user.username}`);
        res.redirect(req.session.redirectTo || req.get('Referrer') || '/');
      });
    });

    auth(req, res, next);
  },
  logout(req, res, next) {
    req.logout();
    res.redirect('/');
  },
  isAuthenticated(req, res, next) {
    if (!req.isAuthenticated()) {
      return false;
    }

    return true;
  },
  isInRole(role) {
    return (req, res, next) => {
      if (req.isAuthenticated() && req.user.roles.indexOf(role) > -1) {
        return true;
      }

      return false;
    };
  },
  twitterLogin: passport.authenticate('twitter', {
    scope: ['include_email=true']
  }),
  twitterCallback: passport.authenticate('twitter', {
    successRedirect: '/settings',
    failureRedirect: '/login'
  }),
  facebookLogin: passport.authenticate('facebook', { scope: ['email'] }),
  facebookCallback: passport.authenticate('facebook', {
    successRedirect: '/settings',
    failureRedirect: '/login'
  })
};
