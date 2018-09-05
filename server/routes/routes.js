// Server and Mongoose Models
import express from 'express';
import mongoose from 'mongoose';
import restify from 'express-restify-mongoose';
import { User, Artwork } from '../models/models.js';

// Wikipedia Parsing
import getWikiInfo from '../helpers/wikiparse.js';

// Google Maps Geocoding API
import axios from 'axios';
import accents from 'remove-accents';

// Router & Routes
const router = express.Router();

// Checks that User is Logged In Before Accessing Other Routes
// router.use('/', (req, res, next) => {
//   if (req.user) {
//     next();
//   } else {
//     res.status(404).send('No user logged in.');
//   }
// });

// RESTIFY API for Accessing Artworks
restify.serve(router, Artwork);

// GET route to get current user information
router.get('/user', (req, res, next) => {
  res.json({ success: true, user: req.user });
});

// POST route for Users to add new Artworks
router.post('/artwork', (req, res, next) => {
  if (!req.body.artworkName) {
    return res.status(404).send('No Artwork Name Provided.');
  } else {
    console.log(req.body.artworkName);
    for (let i = 0; i < req.body.artworkName.length; ++i) {
      let artworkInfoOutter = null;
      getWikiInfo(req.body.artworkName[i])
      .then((info) => {
        const baseURL = 'https://maps.googleapis.com/maps/api/geocode/json?address=';
        const geocodeURL = `${baseURL}${accents.remove(info.museum).split(" ").join("+")}+` +
                           `${accents.remove(info.city).split(" ").join("+")}&key=${process.env.GOOGLE_MAPS_GEOCODE_API_KEY}`;
        artworkInfoOutter = { ...info, dateViewed: new Date() };
        return axios.get(geocodeURL);
      })
      .then((resp) => {
        const { lat, lng } = resp.data.results[0].geometry.location;
        artworkInfoOutter = { ...artworkInfoOutter, lat: lat, lng: lng };
        return Artwork.findOrCreate({ title: artworkInfoOutter.title });
      })
      .then(({ doc }) => {
        return Object.assign(doc, artworkInfoOutter).save();
      })
      .then((artwork) => {
        //req.user.userCollection.push(artwork._id);
        //req.user.save();
        res.json({ success: true, artworkInfo: artwork });
      })
      .catch(err =>{
        console.log(err);
        if(i === req.body.artworkName.length-1) {
          res.status(404).json({ success: false, error: err, msg: 'Could not find artwork.' });
        }
      });
    }
  }
});

// GET route for list of museums for a user's collection
router.get('/museums', (req, res, next) => {
  const test_id = "5b8979eeb50da80b3c119cae";
  // req.user._id
  User.findById(test_id)
  .populate('userCollection', 'museum city lat lng')
  .exec()
  .then(({ userCollection }) => res.json({ success: true, markers: userCollection }))
  .catch(err => res.status(404).json({ success: false, error: err }));
});

export default router;
