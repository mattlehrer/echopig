/* eslint-disable consistent-return */
const passport = require('passport');
const LocalStrategy = require('passport-local');
const TwitterStrategy = require('passport-twitter').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('mongoose').model('User');
const { createUser } = require('../controllers/usersController');
const logger = require('../utilities/logger')(__filename);

module.exports = () => {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
      },
      (req, username, password, done) => {
        User.findOne(
          { normalizedUsername: username.toLowerCase() },
          (err, user) => {
            if (err) {
              return done(err);
            }
            if (!user) {
              // return done(null, false, { msg: `Username ${username} not found.` });
              return done(null, false);
            }
            // eslint-disable-next-line no-shadow
            user.comparePassword(password, (err, isMatch) => {
              if (err) {
                return done(err);
              }
              if (isMatch) {
                return done(null, user);
              }
              // return done(null, false, { msg: 'Invalid username or password.' });
              req.session.error = 'Invalid username or password.';
              return done(null, false);
            });
          }
        );
      }
    )
  );

  passport.use(
    new TwitterStrategy(
      {
        consumerKey: process.env.TWITTER_CONSUMER_KEY,
        consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
        callbackURL: '/auth/twitter/callback',
        passReqToCallback: true,
        proxy: true,
        includeEmail: true
      },
      (req, accessToken, tokenSecret, profile, done) => {
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
            // put profile in our User format
            const newUser = {
              email: profile.email,
              twitter: profile.id,
              tokens: [{ kind: 'twitter', accessToken, tokenSecret }],
              name: profile.displayName,
              // eslint-disable-next-line no-underscore-dangle
              avatar: profile._json.profile_image_url_https
            };
            // eslint-disable-next-line no-shadow
            createUser(newUser, (err, user) => {
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

  passport.use(
    new FacebookStrategy(
      {
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: '/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'emails'],
        passReqToCallback: true
      },
      (req, accessToken, refreshToken, profile, done) => {
        logger.debug('received callback');
        if (req.user) {
          User.findOne({ facebook: profile.id }, (err, existingUser) => {
            if (err) {
              return done(err);
            }
            if (existingUser) {
              req.session.error =
                'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.';
              done(err);
            } else {
              // eslint-disable-next-line no-shadow
              User.findById(req.user.id, (err, user) => {
                if (err) {
                  return done(err);
                }
                user.set('facebook', profile.id);
                user.tokens.push({
                  kind: 'facebook',
                  accessToken,
                  refreshToken
                });
                user.set(
                  'name',
                  user.name || profile.displayName || profile.name
                );
                user.set(
                  'avatar',
                  // eslint-disable-next-line no-underscore-dangle
                  user.avatar ||
                    `https://graph.facebook.com/${
                      profile.id
                    }/picture?type=large`
                );
                // eslint-disable-next-line no-shadow
                user.save(err => {
                  if (err) {
                    return done(err);
                  }
                  req.session.error = 'Facebook account has been linked.';
                  done(err, user);
                });
              });
            }
          });
        } else {
          User.findOne({ facebook: profile.id }, (err, existingUser) => {
            if (err) {
              return done(err);
            }
            if (existingUser) {
              return done(null, existingUser);
            }
            // put profile in our User format
            const newUser = {
              // eslint-disable-next-line no-underscore-dangle
              email: profile.email || profile._json.email,
              facebook: profile.id,
              tokens: [{ kind: 'facebook', accessToken, refreshToken }],
              name: profile.displayName || profile.name,
              // eslint-disable-next-line no-underscore-dangle
              avatar: `https://graph.facebook.com/${
                profile.id
              }/picture?type=large`
            };
            // eslint-disable-next-line no-shadow
            createUser(newUser, (err, user) => {
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
