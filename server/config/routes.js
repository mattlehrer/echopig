const csrf = require('csurf');
const expressWinston = require('express-winston');
const { check } = require('express-validator/check');
const logger = require('../utilities/logger')(__filename);
const auth = require('./auth');
const controllers = require('../controllers');
// const importOldPosts = require('../utilities/import');
const reservedNames = require('../utilities/reservedNames').reserved;

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next();
  else {
    req.flash('errors', 'Please log in or register for an account.');
    res.redirect(req.get('Referrer') || '/');
  }
}

// const env = process.env.NODE_ENV || 'development';
const csrfProtection = csrf({ cookie: false });

module.exports = app => {
  app.use(
    expressWinston.logger({
      winstonInstance: logger,
      expressFormat: true,
      skip: (req, res) => {
        return res.statusCode >= 400;
      }
    })
  );
  // app.get('/import', (req, res, next) => {
  //   if (env === 'development') importOldPosts();
  //   else next();
  // });
  app
    .route('/register')
    .get(csrfProtection, controllers.users.getRegister)
    .post(
      csrfProtection,
      check(
        'username',
        'Please choose a username of only letters and numbers longer than 3 characters.'
      )
        .isAlphanumeric()
        .isLength({ min: 3 }),
      check('username', 'That username is unavailable. Please try again.')
        .not()
        .isIn(reservedNames),
      check('email', 'Please enter a valid email address.').isEmail(),
      check(
        'password',
        'Please choose a password longer than 4 characters'
      ).isLength({ min: 4 }),
      check('confirmPassword', `Passwords didn't match. Please try again`)
        .exists()
        .custom((value, { req }) => value === req.body.password),
      controllers.users.createLocalUser
    );

  app
    .route('/login')
    .get(csrfProtection, controllers.users.getLogin)
    .post(csrfProtection, auth.localLogin);

  app.get(
    '/confirmation/:token',
    check('token', 'Invalid token')
      .isHexadecimal()
      .isLength({ min: 32, max: 32 }),
    controllers.users.getConfirmation
  );
  app
    .route('/resend')
    .get(csrfProtection, controllers.users.getResend)
    .post(
      csrfProtection,
      check('email', 'Please enter a valid email address.').isEmail(),
      controllers.users.postResendToken
    );

  app.get('/forgot', csrfProtection, controllers.users.getForgot);
  app.post(
    '/forgot',
    csrfProtection,
    check('email', 'Please enter a valid email address.').isEmail(),
    controllers.users.postForgot
  );
  app
    .route('/reset/:token')
    .get(csrfProtection, controllers.users.getReset)
    .post(
      csrfProtection,
      check(
        'password',
        'Please use a password longer than 4 characters'
      ).isLength({ min: 4 }),
      check('confirmPassword', `Passwords didn't match. Please try again`)
        .exists()
        .custom((value, { req }) => value === req.body.password),
      controllers.users.postReset
    );

  app.get('/auth/twitter', auth.twitterLogin);
  app.get('/auth/twitter/callback', auth.twitterCallback);
  app.get('/auth/facebook', auth.facebookLogin);
  app.get('/auth/facebook/callback', auth.facebookCallback);

  app.get('/logout', auth.logout);

  app.get(
    '/u(ser)?(s)?/:username',
    check('username', 'Invalid username.')
      .isAlphanumeric()
      .isLength({ min: 3 }),
    controllers.profiles.getProfile
  );
  app.get('/rss/:username', controllers.rss.getRSSFeed);
  app.get('/e(pisode)?(s)?', controllers.posts.getTopEpisodes);
  app.get('/e(pisode)?(s)?/:episode', controllers.episodes.getEpisode);
  app.get('/p(odcast)?(s)?', controllers.podcasts.getTopPodcasts);
  app.get(
    '/p(odcast)?(s)?/i:iTunesID',
    check('iTunesID', `Podcast not found.`)
      .isNumeric()
      .isLength({ min: 8, max: 10 }),
    controllers.podcasts.getPodcastByITunesID
  );
  app.get(
    '/p/i:iTunesID/update',
    ensureAuthenticated,
    controllers.podcasts.updatePodcast
  );
  app.get(
    '/g(enre)?(s)?/:genre',
    controllers.posts.mostPostedEpisodesInGenreInTimeframe
  );

  app.get('/', csrfProtection, (req, res, next) => {
    if (req.isAuthenticated()) {
      controllers.loggedInIndex(req, res, next);
    } else {
      controllers.loggedOutIndex(req, res, next);
    }
  });

  app
    .route('/settings')
    .get(ensureAuthenticated, csrfProtection, controllers.users.getSettings)
    .post(
      ensureAuthenticated,
      csrfProtection,
      [
        check(
          'username',
          'Please choose a username of only letters and numbers longer than 3 characters.'
        )
          .isAlphanumeric()
          .isLength({ min: 3 }),
        check('username', 'That username is unavailable. Please try again.')
          .not()
          .isIn(reservedNames),
        check('email', 'Please enter a valid email address.').isEmail()
      ],
      controllers.users.postSettings
    );

  app.get('/vcard', ensureAuthenticated, controllers.users.getVcard);

  app
    .route('/post')
    .get(csrfProtection, controllers.posts.getNewPost)
    .post(
      ensureAuthenticated,
      csrfProtection,
      check(
        'shareURL',
        `We currently only work with episode share URLs from Apple's Podcasts.app and Overcast`
      ).isURL(),
      check('comment')
        .trim()
        .escape()
        .stripLow({ keep_new_lines: true }),
      controllers.posts.addNewPostViaWeb
    );
  app.post('/mailpost', controllers.posts.addNewPostViaMailgun);

  app.get(
    '/deletePost',
    ensureAuthenticated,
    check('p')
      .isLength({ min: 24, max: 24 })
      .isHexadecimal()
      .withMessage('Invalid post ID'),
    controllers.posts.deletePost
  );

  // catch 404
  // eslint-disable-next-line no-unused-vars
  app.use((req, res, next) => {
    logger.info(`404 - URL requested: ${req.originalUrl}`);
    res.render('404', { currentUser: req.user });
  });

  app.use(
    expressWinston.errorLogger({
      winstonInstance: logger,
      msg: '{{req.method}} {{req.url}} {{err.status}} {{err.message}}'
    })
  );

  // error handler
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error', { currentUser: req.user });
  });

  // app.get('*', (req, res) => {
  //   res.render('index', { currentUser: req.user });
  // });
};
