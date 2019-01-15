const auth = require('./auth');
const controllers = require('../controllers');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) next();
  else res.redirect('/');
}

module.exports = app => {
  app.get('/register', controllers.users.getRegister);
  app.post('/register', controllers.users.createUser);

  app.post('/login', auth.login);
  app.get('/logout', auth.logout);
  app.get('/login', controllers.users.getLogin);
  app.get('/settings', ensureAuthenticated, controllers.users.getSettings);
  app.get('/vcard', ensureAuthenticated, controllers.users.getVcard);

  app.get('/post', controllers.episodes.getNewEpisodeViaWeb);
  app.post(
    '/post',
    ensureAuthenticated,
    controllers.episodes.addNewEpisodeViaWeb
  );
  app.post('/mailpost', controllers.episodes.addNewEpisodeViaMailgun);

  app.get('/u/:username', controllers.users.getUserProfile);
  app.get('/rss/:username', controllers.rss.getRSSFeed);

  app.get('/', (req, res) => {
    res.render('index', { currentUser: req.user });
  });

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
  });

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
