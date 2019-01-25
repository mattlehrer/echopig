/* eslint-disable no-param-reassign */
const express = require('express');
const favicon = require('serve-favicon');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const mongoose = require('mongoose');
const relativeTime = require('../utilities/relativeTime');
const auth = require('./auth');

module.exports = (app, config) => {
  app.set('view engine', 'pug');
  app.use(favicon(`${config.rootPath}/public/favicon.ico`));
  app.set('views', `${config.rootPath}/server/views`);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      store: new MongoStore({
        mongooseConnection: mongoose.connection,
        collection: 'epSessions'
      }),
      cookie: {
        httpOnly: true,
        secure: false,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
      },
      secret: '124 10003',
      resave: false,
      saveUninitialized: true
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(`${config.rootPath}/public`));
  app.locals.relativeTime = relativeTime;

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
