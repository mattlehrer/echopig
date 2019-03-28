/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator/check');

const usersData = require('../data/usersData');
// const logger = require('../utilities/logger')(__filename);

module.exports = {
  getProfile(req, res, next) {
    // skip db find on invalid username
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // just serve 404 page
      // errors.array().forEach(e => {
      //   req.flash('errors', e.msg);
      // });
      next();
      return;
    }
    usersData.findUserByUsername(
      req.params.username.toLowerCase(),
      (err, profiledUser) => {
        if (err) {
          next(err);
          return;
        }
        if (!profiledUser) {
          if (req.user) {
            req.flash('errors', "We can't find a user with that name.");
          } else {
            req.flash(
              'errors',
              "We can't find a user with that name. Do you want to create it?"
            );
          }
          next();
          return;
        }
        res.render('profile/profile', {
          currentUser: req.user,
          profiledUser
        });
      }
    );
  }
};
