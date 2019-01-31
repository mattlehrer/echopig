const csrf = require('csurf');
const expressWinston = require('express-winston');
const logger = require('../utilities/logger')(__filename);
const auth = require('./auth');
const controllers = require('../controllers');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next();
  else {
    req.session.error = 'Please log in or register for an account.';
    res.redirect(req.get('Referrer') || '/');
  }
}

const csrfProtection = csrf({ cookie: true });

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

  app
    .route('/register')
    .get(csrfProtection, controllers.users.getRegister)
    .post(csrfProtection, controllers.users.createUser);

  app
    .route('/login')
    .get(csrfProtection, controllers.users.getLogin)
    .post(csrfProtection, auth.login);

  app.get('/logout', auth.logout);

  app.get('/u/:username', controllers.profiles.getProfile);
  app.get('/rss/:username', controllers.rss.getRSSFeed);
  app.get('/e/:episode', controllers.episodes.getEpisode);
  app.get('/p/itunes:iTunesID', controllers.podcasts.getPodcastByITunesID);

  app.get('/', (req, res) => {
    res.render('index', { currentUser: req.user });
  });

  app.get('/settings', ensureAuthenticated, controllers.users.getSettings);
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
