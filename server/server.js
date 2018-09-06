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

// Passport.js Normal LocalStrategy
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

// Passport.js with Facebook Tokens
passport.use(new FacebookTokenStrategy({
    clientID: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
  }, (accessToken, refreshToken, profile, done) => {
    User.findOrCreate({ facebookId: profile.id }, (err, user) => {
      const [firstName, lastName] = profile.displayName.split(' ');
      if (err) { return done(err); }
      Object.assign(user, { firstName, lastName, email: profile._json.email, profileImgURL: profile.photos[0].value }).save()
      .then((user) => done(null, user));
    });
  }
));

// Passport.js with Twitter Tokens
passport.use(new TwitterTokenStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  }, (token, tokenSecret, profile, done) => {
    const [firstName, lastName] = profile.displayName.split(' ');
    const profileImgURL = profile._json.profile_image_url.split('_normal').join('');
    User.findOrCreate({ twitterId: profile.id }, (err, user) => {
      if (err) { console.log(err); return done(err); }
      Object.assign(user, { firstName, lastName, profileImgURL }).save()
      .then((user) => done(null, user));
    });
  }
));

// For cookies and to determine who user is
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
