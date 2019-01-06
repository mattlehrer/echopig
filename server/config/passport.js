/* eslint-disable consistent-return */
const passport = require('passport');

const LocalPassport = require('passport-local');

const User = require('mongoose').model('User');

module.exports = () => {
  passport.use(
    new LocalPassport((username, password, done) => {
      User.findOne({ username }).exec((err, user) => {
        if (err) {
          console.log(`Error loading user: ${err}`);
          return;
        }

        if (user && user.authenticate(password)) {
          return done(null, user);
        }

        return done(null, false);
      });
    })
  );

  passport.serializeUser((user, done) => {
    if (user) {
      // eslint-disable-next-line no-underscore-dangle
      return done(null, user._id);
    }
  });

  passport.deserializeUser((id, done) => {
    User.findOne({ _id: id }).exec((err, user) => {
      if (err) {
        console.log(`Error loading user: ${err}`);
        return;
      }

      if (user) {
        return done(null, user);
      }

      return done(null, false);
    });
  });
};
