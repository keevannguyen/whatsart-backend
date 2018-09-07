import mongoose from 'mongoose';
import findOrCreate from 'mongoose-findorcreate';

// Mongoose Connection
if (!process.env.MONGODB_URI) {
  console.log('Error: MONGODB_URI is not set. Did you run source env.sh ?');
  process.exit(1);
}

mongoose.connection.on('connected', () => console.log('Connected to MongoDB!'));
mongoose.connection.on('error', () => console.log('Failed to connect to MongoDB.'));
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true });

// Schemas
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    default: '',
    type: String,
  },
  firstName: {
    default: '',
    type: String,
  },
  lastName: {
    default: '',
    type: String,
  },
  password: {
    type: String,
  },
  userCollection: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
  }],
  userFavorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artwork',
  }],
  facebookId: {
    required: false,
    type: 'String',
  },
  twitterId: {
    required: false,
    type: 'String',
  },
  profileImgURL: {
    required: false,
    type: 'String',
  }
});

const artworkSchema = new Schema({
  title: {
    default: '',
    type: String,
  },
  artist: {
    default: '',
    type: String,
  },
  year: {
    default: '',
    type: String,
  },
  city: {
    default: '',
    type: String,
  },
  museum: {
    default: '',
    type: String,
  },
  lat: {
    default: '',
    type: String,
  },
  lng: {
    default: '',
    type: String,
  },
  medium: {
    default: '',
    type: String,
  },
  dimensions: {
    default: '',
    type: String,
  },
  summary: {
    default: '',
    type: String,
  },
  imgURL: {
    default: '',
    type: String,
  },
  dateViewed: {
    default: null,
    type: Date,
  },
});

// Plugins
userSchema.plugin(findOrCreate);
artworkSchema.plugin(findOrCreate);

// Models
const User = mongoose.model("User", userSchema);
const Artwork = mongoose.model("Artwork", artworkSchema);

export { mongoose, User, Artwork };
