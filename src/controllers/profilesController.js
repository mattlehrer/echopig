/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const { validationResult } = require('express-validator/check');

const usersData = require('../data/usersData');
const logger = require('../utilities/logger')(__filename);

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
          logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
          next(err);
          return;
        }
        if (!profiledUser) {
          // send to 404
          next();
          return;
        }
        res.render('profile/profile', {
          currentUser: req.user,
          profiledUser,
        });
      },
    );
  },
  getSaves(req, res, next) {
    usersData.findUserByIdWithSaves(req.user.id, (err, userWithSaves) => {
      if (err) {
        logger.error(JSON.stringify(err, Object.getOwnPropertyNames(err)));
        next(err);
        return;
      }
      if (!userWithSaves) {
        logger.error(
          `${req.user.id} is logged in but returned null getting saves`,
        );
        req.flash(
          'errors',
          "Something went wrong. We've logged the error and will try to do better.",
        );
        res.redirect(req.get('Referrer') || '/');
        return;
      }
      res.render('profile/saves', {
        currentUser: userWithSaves,
      });
    });
  },
};
