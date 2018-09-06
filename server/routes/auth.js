import express from 'express';
import crypto from 'crypto';
import { User } from '../models/models.js';
import twitterAPI from 'node-twitter-api';

const router = express.Router();

export default (passport) => {
  // POST Regular Login Request
  router.post('/login',
    passport.authenticate('local'),
    (req, res) => {
      res.json({ id: req.user._id, success: true });
    },
  );

  // POST Facebook Login Request
  router.post('/facebookLogin',
    passport.authenticate('facebook-token'),
    (req, res) => {
      res.json({ firstName: req.user.firstName, success: true });
    },
  );

  // GET Twitter Request Token to Request OAuth
  router.get('/twitterRequestToken', (req, res) => {
    const twitter = new twitterAPI({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
      callback: decodeURIComponent(req.query.callbackURL),
    });
    twitter.getRequestToken((error, requestToken, requestTokenSecret, results) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.json({ success: true, requestToken: requestToken, requestTokenSecret: requestTokenSecret });
      }
    });
  });

  // POST Twitter OAuth Access Token
  router.post('/twitterOAuth', (req, res, next) => {
    const twitter = new twitterAPI({
      consumerKey: process.env.TWITTER_CONSUMER_KEY,
      consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    });
    const { requestToken, requestTokenSecret, oauth_verifier } = req.body;
    twitter.getAccessToken(requestToken, requestTokenSecret, oauth_verifier, (error, accessToken, accessTokenSecret, results) => {
      if (error) {
        res.status(500).send(error);
      } else {
        res.json({ ...results, accessToken: accessToken, accessTokenSecret: accessTokenSecret, success: true });
      }
    });
  });

  // GET Twitter Login Request
  router.get('/twitterLogin',
    passport.authenticate('twitter-token'),
    (req, res) => {
      console.log(req.user);
      res.json({ firstName: 'testing', success: true });
    }
  );

  // Signup Validation Helper
  const validateSignup = userData => (userData.email && userData.firstName && userData.lastName && userData.password);

  // sha256 Hashing For Passwords
  const hashPassword = (password) => {
    const hash = crypto.createHash('sha256');
    hash.update(password);
    return hash.digest('hex');
  };

  // POST Signup Request
  router.post('/signup', (req, res) => {
    if (!validateSignup(req.body)) {
      res.json({ success: false });
    }
    else {
      const { firstName, lastName, password } = req.body;
      const email = req.body.email.toLowerCase();
      User.find({ email: email })
      .then((users) => {
        if (users.length) {
          res.json({ success: false, emailTaken: users[0].email === email });
        }
        else {
          const user = new User({
            email: email,
            firstName: firstName,
            lastName: lastName,
            password: hashPassword(password),
            userCollection: [],
          });
          return user.save();
        }
      })
      .then(() => res.json({ success: true }))
      .catch((err) => res.json({ success: false, msg: 'MongoDB Error', error: err }));
    }
  });

  // GET Logout Request
  router.get('/logout', (req, res) => {
    req.logout();
    res.json({ success: true });
  });

  return router;
};
