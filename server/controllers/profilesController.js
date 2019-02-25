/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const usersData = require('../data/usersData');
// const logger = require('../utilities/logger')(__filename);

module.exports = {
  getProfile(req, res, next) {
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
