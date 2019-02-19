/* eslint-disable no-unused-vars */
const passport = require('passport');
const logger = require('../utilities/logger')(__filename);

module.exports = {
  localLogin(req, res, next) {
    const auth = passport.authenticate('local', (err, user) => {
      if (err) {
        next(err);
        return;
      }
      if (!user) {
        req.flash('errors', 'Invalid Username or Password!');
        res.redirect('/login');
      }

      // eslint-disable-next-line no-shadow
      req.logIn(user, err => {
        if (err) {
          next(err);
          return;
        }
        // TODO make the homepage more interesting
        // until then redirect to user profile on login
        // res.redirect('/');
        res.redirect(`/u/${req.user.username}`);
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
  facebookLogin: passport.authenticate('facebook'),
  facebookCallback: passport.authenticate('facebook', {
    successRedirect: '/settings',
    failureRedirect: '/login'
  })
};
