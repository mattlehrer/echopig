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
        }
        if (profiledUser === null) {
          const error = new Error('User Not Found');
          error.status = 404;
          next(error);
        } else {
          res.render('profile/profile', {
            currentUser: req.user,
            profiledUser
          });
        }
      }
    );
  }
};
