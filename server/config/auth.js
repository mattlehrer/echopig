/* eslint-disable consistent-return */
/* eslint-disable no-unused-vars */
/* eslint-disable no-shadow */
const passport = require('passport');

module.exports = {
  login(req, res, next) {
    const auth = passport.authenticate('local', (err, user) => {
      if (err) return next(err);
      if (!user) {
        req.session.error = 'Invalid Username or Password!';
        res.redirect('/login');
      }

      req.logIn(user, err => {
        if (err) return next(err);
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
  }
};
