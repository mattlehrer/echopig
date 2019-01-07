/* eslint-disable no-unused-vars */
/* eslint-disable no-underscore-dangle */
const encryption = require('../utilities/cripto');
const usersData = require('../data/usersData');

module.exports = {
  getRegister(req, res, next) {
    if (req.user) {
      res.redirect('/');
    } else {
      res.render('users/register');
    }
  },
  createUser(req, res, next) {
    const newUserData = req.body;

    if (newUserData.password !== newUserData.confirmPassword) {
      req.session.error = 'Passwords do not match!';
      res.redirect('/register');
    } else {
      newUserData.salt = encryption.generateSalt();
      newUserData.hashPass = encryption.generateHashedPassword(
        newUserData.salt,
        newUserData.password
      );
      usersData.createUser(newUserData, (err, user) => {
        if (err) {
          req.session.error = 'Username exists!';
          res.redirect('/register');
          return;
        }

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
      res.render('users/login');
    }
  },
  getProfile(req, res, next) {
    if (!req.user) {
      res.redirect('/');
    } else {
      res.render('profile/profile', {
        currentUser: req.user,
        userToUpdate: req.user
      });
    }
  }
};
