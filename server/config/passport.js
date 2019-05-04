/* eslint-disable consistent-return */
const passport = require('passport');
const LocalStrategy = require('passport-local');
const TwitterStrategy = require('passport-twitter').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const validator = require('validator');
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
              logger.error(
                `localStrategy find by username error: ${JSON.stringify(
                  err,
                  Object.getOwnPropertyNames(err)
                )}`
              );
              return done(err);
            }
            if (!user) {
              // req.flash('errors', `Username ${username} not found.`);
              return done(null, false);
            }
            // eslint-disable-next-line no-shadow
            user.comparePassword(password, (err, isMatch) => {
              if (err) {
                logger.error(
                  `localStrategy comparePassword failure for: ${user.username}`
                );
                return done(err);
              }
              if (isMatch) {
                logger.info(`localStrategy login for: ${user.username}`);
                return done(null, user);
              }
              logger.info(`localStrategy login failure for: ${user.username}`);
              req.flash('errors', 'Invalid username or password.');
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
              logger.error(
                `TwitterStrategy find by twitter error for user: ${
                  req.user.username
                }: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`
              );
              return done(err);
            }
            if (existingUser) {
              logger.info(
                `Logged in: ${
                  req.user.username
                } - Twitter account: ${profile} registered to different user: ${
                  existingUser.username
                }`
              );
              req.flash(
                'errors',
                'There is already a Twitter account that belongs to you. Sign in with that account or delete it, then link it with your current account.'
              );
              done(err);
            } else {
              // eslint-disable-next-line no-shadow
              User.findById(req.user.id, (err, user) => {
                if (err) {
                  logger.error(
                    `TwitterStrategy findById error: ${JSON.stringify(
                      err,
                      Object.getOwnPropertyNames(err)
                    )}`
                  );
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
                    logger.error(
                      `TwitterStrategy user.save error for user: ${
                        user.username
                      }: with: ${JSON.stringify(
                        err,
                        Object.getOwnPropertyNames(err)
                      )}`
                    );
                    return done(err);
                  }
                  logger.info(`updated user ${user.username} with twitter id`);
                  req.flash('info', 'Twitter account has been linked.');
                  done(err, user);
                });
              });
            }
          });
        } else {
          User.findOne({ twitter: profile.id }, (err, existingUser) => {
            if (err) {
              logger.error(
                `TwitterStrategy find by twitter error for new user: ${JSON.stringify(
                  err
                )}`
              );
              return done(err);
            }
            if (existingUser) {
              logger.info(`Twitter login: ${existingUser.username}`);
              return done(null, existingUser);
            }
            // put profile in our User format
            const newUser = {
              // temp username
              username: `temp{${profile.id}}twitter`,
              email: profile.emails[0].value,
              twitter: profile.id,
              tokens: [{ kind: 'twitter', accessToken, tokenSecret }],
              name: profile.displayName,
              // eslint-disable-next-line no-underscore-dangle
              avatar: profile._json.profile_image_url_https
            };
            // no twitter profile id found, now check for existing user with that email
            // if twitter gave us an email address
            if (newUser.email) {
              User.findOne(
                { normalizedEmail: validator.normalizeEmail(newUser.email) },
                // eslint-disable-next-line no-shadow
                (err, existingEmail) => {
                  if (err) {
                    logger.error(
                      `TwitterStrategy find email error for user: ${newUser} with: ${JSON.stringify(
                        err
                      )}`
                    );
                    return done(err);
                  }
                  if (existingEmail) {
                    existingEmail.set({ twitter: profile.id });
                    existingEmail.tokens.push({
                      kind: 'twitter',
                      accessToken,
                      tokenSecret
                    });
                    existingEmail.set({ name: profile.displayName });
                    if (!existingEmail.avatar) {
                      existingEmail.set({
                        // eslint-disable-next-line no-underscore-dangle
                        avatar: profile._json.profile_image_url_https
                      });
                    }
                    // eslint-disable-next-line no-shadow
                    existingEmail.save((err, user) => {
                      if (err) {
                        logger.error(
                          `TwitterStrategy found existing email error on update for user: ${existingEmail} with: ${JSON.stringify(
                            err
                          )}`
                        );
                        // return done(err);
                        // error on save but return the right user anyway
                        return done(null, user);
                      }
                      logger.info(
                        `Updated user on Twitter login matching existing email: ${JSON.stringify(
                          user
                        )}`
                      );
                      return done(null, user);
                    });
                  } else {
                    // no existing email found
                    // eslint-disable-next-line no-shadow
                    return createUser(newUser, (err, user) => {
                      if (err) {
                        logger.error(
                          `TwitterStrategy createUser error for user: ${newUser} with: ${JSON.stringify(
                            err
                          )}`
                        );
                        return done(err);
                      }
                      logger.info(
                        `Created user on Twitter login: ${JSON.stringify(user)}`
                      );
                      return done(null, user);
                    });
                  }
                }
              );
            } else {
              // eslint-disable-next-line no-shadow
              createUser(newUser, (err, user) => {
                if (err) {
                  logger.error(
                    `TwitterStrategy createUser error for user: ${newUser} with: ${JSON.stringify(
                      err
                    )}`
                  );
                  return done(err);
                }
                logger.info(
                  `Created user on Twitter login: ${JSON.stringify(user)}`
                );
                return done(null, user);
              });
            }
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
        if (req.user) {
          User.findOne({ facebook: profile.id }, (err, existingUser) => {
            if (err) {
              logger.error(
                `FacebookStrategy find by facebook error for user: ${
                  req.user.username
                }: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`
              );
              return done(err);
            }
            if (existingUser) {
              logger.info(
                `Logged in: ${
                  req.user.username
                } - Facebook account: ${profile} registered to different user: ${
                  existingUser.username
                }`
              );
              req.flash(
                'errors',
                'There is already a Facebook account that belongs to you. Sign in with that account or delete it, then link it with your current account.'
              );
              done(err);
            } else {
              // eslint-disable-next-line no-shadow
              User.findById(req.user.id, (err, user) => {
                if (err) {
                  logger.error(
                    `FacebookStrategy findById error: ${JSON.stringify(
                      err,
                      Object.getOwnPropertyNames(err)
                    )}`
                  );
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
                    logger.error(
                      `FacebookStrategy user.save error for user: ${
                        user.username
                      }: with: ${JSON.stringify(
                        err,
                        Object.getOwnPropertyNames(err)
                      )}`
                    );
                    return done(err);
                  }
                  logger.info(`updated user ${user.username} with facebook id`);
                  req.flash('info', 'Facebook account has been linked.');
                  done(err, user);
                });
              });
            }
          });
        } else {
          User.findOne({ facebook: profile.id }, (err, existingUser) => {
            if (err) {
              logger.error(
                `FacebookStrategy find by facebook error for new user: ${JSON.stringify(
                  err
                )}`
              );
              return done(err);
            }
            if (existingUser) {
              // user has previously logged in with facebook
              logger.info(`Facebook login: ${existingUser.username}`);
              return done(null, existingUser);
            }
            // put profile in our User format
            const newUser = {
              // temp username
              username: `temp{${profile.id}}facebook`,
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
            // no facebook profile id found, now check for existing user with that email
            // if facebook gave us an email address
            if (newUser.email) {
              User.findOne(
                { normalizedEmail: validator.normalizeEmail(newUser.email) },
                // eslint-disable-next-line no-shadow
                (err, existingEmail) => {
                  if (err) {
                    logger.error(
                      `FacebookStrategy find email error for user: ${newUser} with: ${JSON.stringify(
                        err
                      )}`
                    );
                    return done(err);
                  }
                  if (existingEmail) {
                    existingEmail.set({ facebook: profile.id });
                    existingEmail.tokens.push({
                      kind: 'facebook',
                      accessToken,
                      refreshToken
                    });
                    existingEmail.set({
                      name: profile.displayName || profile.name
                    });
                    if (!existingEmail.avatar) {
                      existingEmail.set({
                        avatar: `https://graph.facebook.com/${
                          profile.id
                        }/picture?type=large`
                      });
                    }
                    // eslint-disable-next-line no-shadow
                    existingEmail.save((err, user) => {
                      if (err) {
                        logger.error(
                          `FacebookStrategy found existing email error on update for user: ${existingEmail} with: ${JSON.stringify(
                            err
                          )}`
                        );
                        // return done(err);
                        // error on save but return the right user anyway
                        return done(null, user);
                      }
                      logger.info(
                        `updated user on facebook login matching existing email: ${JSON.stringify(
                          user
                        )}`
                      );
                      return done(null, user);
                    });
                  } else {
                    // no existing email found
                    // eslint-disable-next-line no-shadow
                    return createUser(newUser, (err, user) => {
                      if (err) {
                        logger.error(
                          `FacebookStrategy createUser error for user: ${newUser} with: ${JSON.stringify(
                            err
                          )}`
                        );
                        return done(err);
                      }
                      logger.info(
                        `created user on facebook login: ${JSON.stringify(
                          user
                        )}`
                      );
                      return done(null, user);
                    });
                  }
                }
              );
            } else {
              // eslint-disable-next-line no-shadow
              createUser(newUser, (err, user) => {
                if (err) {
                  logger.error(
                    `FacebookStrategy createUser error for user: ${newUser} with: ${JSON.stringify(
                      err
                    )}`
                  );
                  return done(err);
                }
                logger.info(
                  `created user on facebook login: ${JSON.stringify(user)}`
                );
                return done(null, user);
              });
            }
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
        logger.error(
          `Error loading user: ${JSON.stringify(
            err,
            Object.getOwnPropertyNames(err)
          )}`
        );
        return;
      }

      if (user) {
        return done(null, user);
      }

      return done(null, false);
    });
  });
};
