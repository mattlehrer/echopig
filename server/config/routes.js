const csrf = require('csurf');
const expressWinston = require('express-winston');
const logger = require('../utilities/logger')(__filename);
const auth = require('./auth');
const controllers = require('../controllers');
const importOldPosts = require('../utilities/import');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next();
  else {
    req.session.error = 'Please log in or register for an account.';
    res.redirect(req.get('Referrer') || '/');
  }
}

const env = process.env.NODE_ENV || 'development';
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
  app.get('/import', (req, res, next) => {
    if (env === 'development') importOldPosts();
    else next();
  });
  app
    .route('/register')
    .get(csrfProtection, controllers.users.getRegister)
    .post(csrfProtection, controllers.users.createLocalUser);

  app
    .route('/login')
    .get(csrfProtection, controllers.users.getLogin)
    .post(csrfProtection, auth.localLogin);

  app.get('/auth/twitter', auth.twitterLogin);
  app.get('/auth/twitter/callback', auth.twitterCallback);
  app.get('/auth/facebook', auth.facebookLogin);
  app.get('/auth/facebook/callback', auth.facebookCallback);

  app.get('/logout', auth.logout);

  app.get('/u/:username', controllers.profiles.getProfile);
  app.get('/rss/:username', controllers.rss.getRSSFeed);
  app.get('/e/:episode', controllers.episodes.getEpisode);
  app.get('/p/i:iTunesID', controllers.podcasts.getPodcastByITunesID);
  app.get(
    '/p/i:iTunesID/update',
    ensureAuthenticated,
    controllers.podcasts.updatePodcast
  );
  app.get('/g/:genre', controllers.posts.mostPostedEpisodesInGenreInTimeframe);
  app.get('/top', controllers.posts.mostPostedEpisodesInTimeframe);

  app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
      res.render('loggedInIndex', { currentUser: req.user });
    } else {
      res.render('loggedOutIndex');
    }
  });

  app
    .route('/settings')
    .get(ensureAuthenticated, csrfProtection, controllers.users.getSettings)
    .post(ensureAuthenticated, csrfProtection, controllers.users.postSettings);

  app.get('/vcard', ensureAuthenticated, controllers.users.getVcard);

  app
    .route('/post')
    .get(csrfProtection, controllers.posts.getNewPost)
    .post(
      ensureAuthenticated,
      csrfProtection,
      controllers.posts.addNewPostViaWeb
    );
  app.post('/mailpost', controllers.posts.addNewPostViaMailgun);

  app.get('/deletePost', ensureAuthenticated, controllers.posts.deletePost);

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
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
