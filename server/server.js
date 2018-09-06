// Server Middleware
import internalIp from 'internal-ip';
import http from 'http';
import express from 'express';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';

// Routes
import auth from './routes/auth';
import routes from './routes/routes.js';

// Passport
import passport from 'passport';
import crypto from 'crypto';
import { Strategy as LocalStrategy } from 'passport-local';
import FacebookTokenStrategy from 'passport-facebook-token';
import TwitterTokenStrategy from 'passport-twitter-token';

import { mongoose, User } from './models/models.js';

// MongoDB & Sessions
import session from 'express-session';
const MongoStore = require('connect-mongo')(session);

// Initializing Server
const app = express();
const server = http.Server(app);
const port = process.env.PORT || 3002;
server.listen(port);
console.log(`Server running at http://${internalIp.v4.sync()}:${port}/`);

// Initializing Middleware
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride());
app.use(session({
  secret: process.env.SECRET,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
  resave: true,
  saveUninitialized: false,
}));

// Hash Function for Passwords
const hashPassword = (password) => {
  const hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
};

// Passport Methods
passport.use(new LocalStrategy({ usernameField: 'email' }, (username, password, done) => {
  User.findOne({ email: username }, (err, user) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(null, false);
    }
    if (user.password !== hashPassword(password)) {
      return done(null, false);
    }
    return done(null, user);
  });
}));

passport.use(new FacebookTokenStrategy({
    clientID: '2159152801010115',
    clientSecret: 'ba7d5803b3f300f649dcb80d8f8e0b21'
  }, (accessToken, refreshToken, profile, done) => {
    User.findOrCreate({ facebookId: profile.id }, (error, user) => {
      if (err) { return done(err); }
      Object.assign(user, { firstName: profile._json.first_name, lastName: profile._json.last_name, email: profile._json.email }).save()
      .then((user) => done(null, user));
    });
  }
));

passport.use(new TwitterTokenStrategy({
    consumerKey: 'Z9LPmRyv1tGdunVsLs8TeqvYx',
    consumerSecret: 'AY0yaGumwKjB9AJHnh3A8ggvzYun7pfuMtBheuNnkuxqvcJi1s'
  }, (token, tokenSecret, profile, done) => {
    console.log(profile);
    User.findOrCreate({ twitterId: profile.id }, (error, user) => {
      if (err) { console.log(err); return done(err); }
      Object.assign(user, {}).save()
      .then((user) => done(null, user));
    });
  }
));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// All Routes
app.use('/', auth(passport));
app.use('/', routes);
