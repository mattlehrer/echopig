const auth = require('./auth');

const controllers = require('../controllers');

module.exports = app => {
  app.get('/register', controllers.users.getRegister);
  app.post('/register', controllers.users.createUser);

  app.post('/login', auth.login);
  app.get('/logout', auth.logout);
  app.get('/login', controllers.users.getLogin);

  app.get('/', (req, res) => {
    res.render('index', { currentUser: req.user });
  });

  app.get('*', (req, res) => {
    res.render('index', { currentUser: req.user });
  });
};
