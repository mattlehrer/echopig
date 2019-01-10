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

  app.post('/post', controllers.episodes.addNewEpisode);

  // app.get('/u/:username', controllers.users.getUserProfile);
  // app.get('/rss/:username', controllers.users.getRSSFeed);

  app.get('/', (req, res) => {
    res.render('index', { currentUser: req.user });
  });

  // app.get('*', (req, res) => {
  //   res.render('index', { currentUser: req.user });
  // });
};
