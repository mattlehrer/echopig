/* eslint-disable no-param-reassign */
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const auth = require('./auth');

module.exports = (app, config) => {
  app.set('view engine', 'pug');
  app.set('views', `${config.rootPath}/server/views`);
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(
    session({ secret: '124 10003', resave: true, saveUninitialized: true })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(`${config.rootPath}/public`));

  app.use('/admin', (req, res, next) => {
    if (!auth.isInRole('admin')(req, res, next)) {
      req.session.error = 'You are not authorized!';
      res.redirect('/');
      return;
    }

    next();
  });

  app.use((req, res, next) => {
    if (req.session.error) {
      const msg = req.session.error;
      req.session.error = undefined;
      app.locals.errorMessage = msg;
    } else {
      app.locals.errorMessage = undefined;
    }

    next();
  });
};
