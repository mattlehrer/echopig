/* eslint-disable no-param-reassign */
const express = require('express');
const helmet = require('helmet');
const favicon = require('serve-favicon');
const session = require('express-session');
const flash = require('express-flash');
const MongoStore = require('connect-mongo')(session);
const passport = require('passport');
const mongoose = require('mongoose');
const sass = require('node-sass-middleware');
const he = require('he');
// const logger = require('../utilities/logger')(__filename);
const relativeTime = require('../utilities/relativeTime');
const auth = require('./auth');

module.exports = (app, config) => {
  app.set('trust proxy', 1);
  app.use(
    helmet({
      frameguard: false, // turned on in nginx config
      noSniff: false, // turned on in nginx config
      featurePolicy: {
        features: {
          geolocation: ["'none'"],
          midi: ["'none'"],
          notifications: ["'none'"],
          push: ["'none'"],
          syncXhr: ["'none'"],
          microphone: ["'none'"],
          camera: ["'none'"],
          magnetometer: ["'none'"],
          gyroscope: ["'none'"],
          speaker: ["'self'"],
          vibrate: ["'none'"],
          fullscreen: ["'none'"],
          payment: ["'none'"]
        }
      },
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'", 'www.google-analytics.com'],
          styleSrc: ["'self'", 'fonts.googleapis.com'],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", '*', 'data:'],
          mediaSrc: ['*'],
          fontSrc: ["'self'", 'fonts.gstatic.com']
        }
      },
      referrerPolicy: { policy: 'no-referrer-when-downgrade' }
    })
  );
  app.set('view engine', 'pug');
  app.use(favicon(`${config.rootPath}/public/favicon.ico`));
  app.set('views', `${config.rootPath}/server/views`);
  app.use(
    sass({
      src: `${config.rootPath}/public`,
      dest: `${config.rootPath}/public`,
      outputStyle: 'compressed'
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      store: new MongoStore({
        mongooseConnection: mongoose.connection,
        collection: 'epSessions'
      }),
      cookie: {
        // domain: 'echopig.com',
        httpOnly: true,
        secure: true,
        signed: true,
        maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
      },
      secret: process.env.COOKIE_SECRET,
      name: 'epCookie',
      resave: false,
      saveUninitialized: false
    })
  );
  app.use(flash());

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(express.static(`${config.rootPath}/public`));
  app.use(
    '/webfonts',
    express.static(
      `${config.rootPath}/node_modules/@fortawesome/fontawesome-free/webfonts`,
      { maxAge: 31557600000 }
    )
  );
  app.locals.relativeTime = relativeTime;
  app.locals.decode = he.decode;

  app.use('/admin', (req, res, next) => {
    if (!auth.isInRole('admin')(req, res, next)) {
      req.flash('errors', 'You are not authorized!');
      res.redirect('/');
      return;
    }

    next();
  });
};
