/* eslint-disable consistent-return */
const passport = require('passport');
const LocalPassport = require('passport-local');
const TwitterStrategy = require('passport-twitter').Strategy;
const User = require('mongoose').model('User');
const { createUser } = require('../controllers/usersController');
const logger = require('../utilities/logger')(__filename);

module.exports = () => {
  passport.use(
    new LocalPassport((username, password, done) => {
      User.findOne({ username }).exec((err, user) => {
        if (err) {
          logger.error(`Error loading user: ${err}`);
          return;
        }

        if (user && user.authenticate(password)) {
          return done(null, user);
        }

        return done(null, false);
      });
    })
  );

  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: '/auth/twitter/callback',
        passReqToCallback: true,
        // proxy: true,
        includeEmail: true
      },
      (req, accessToken, tokenSecret, profile, done) => {
        logger.debug('received callback');
        if (req.user) {
          User.findOne({ twitter: profile.id }, (err, existingUser) => {
            if (err) {
              return done(err);
            }
            if (existingUser) {
              req.session.error =
                'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.';
              done(err);
            } else {
              // eslint-disable-next-line no-shadow
              User.findById(req.user.id, (err, user) => {
                if (err) {
                  return done(err);
                }
                user.set('twitter', profile.id);
                user.tokens.push({ kind: 'twitter', accessToken, tokenSecret });
                user.set('name', user.name || profile.displayName);
                user.set(
                  'avatar',
                  // eslint-disable-next-line no-underscore-dangle
                  user.avatar || profile._json.profile_image_url_https
                );
                // eslint-disable-next-line no-shadow
                user.save(err => {
                  if (err) {
                    return done(err);
                  }
                  logger.debug(``);
                  req.session.error = 'Twitter account has been linked.';
                  done(err, user);
                });
              });
            }
          });
        } else {
          User.findOne({ twitter: profile.id }, (err, existingUser) => {
            if (err) {
              return done(err);
            }
            if (existingUser) {
              return done(null, existingUser);
            }
            // eslint-disable-next-line no-shadow
            createUser(profile, (err, user) => {
              if (err) {
                return done(err);
              }
              return done(null, user);
            });
          });
        }
      }
    )
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
        logger.error(`Error loading user: ${err}`);
        return;
      }

      if (user) {
        return done(null, user);
      }

      return done(null, false);
    });
  });
};
