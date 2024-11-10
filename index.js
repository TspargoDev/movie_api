const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Models = require('./models.js');
const passport = require('passport');
const passportLocal = require('passport-local');  
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const passportJWT = require('passport-jwt');

const app = express();
const Movie = Models.Movie;
const User = Models.User;

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const LocalStrategy = passportLocal.Strategy; 

// Middleware Setup
app.use(cors());
app.use(express.json()); // To parse JSON
app.use(morgan('combined')); // To log requests to the console
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files
app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'favicon.ico')));

// MongoDB Connection
mongoose.connect(
  'mongodb+srv://movieADmin:IWAfTndNfIdEBSCygSGw@cluster0.zucea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
);

// Passport Setup
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'your_jwt_secret',
    },
    async (jwtPayload, callback) => {
      try {
        const user = await User.findById(jwtPayload._id);
        return callback(null, user);
      } catch (error) {
        return callback(error);
      }
    }
  )
);

passport.use(
  new LocalStrategy(
    {
      usernameField: 'Username',
      passwordField: 'Password',
    },
    async (username, password, callback) => {
      try {
        const user = await User.findOne({ Username: username });
        if (!user || !user.validatePassword(password)) {
          return callback(null, false, { message: 'Incorrect Username or Password.' });
        }
        return callback(null, user);
      } catch (error) {
        return callback(error);
      }
    }
  )
);

// Routes
// Base Route
app.get('/', (req, res) => {
  res.send('Welcome to My Movie API! Access /movies to see my top 10 movies.');
});

// Movies Routes
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
  Movie.find()
    .then((movies) => res.status(200).json(movies))
    .catch((err) => res.status(500).json({ message: 'Error retrieving movies', error: err }));
});

app.get('/movies/:id', (req, res) => {
  const movieId = req.params.id;
  Movie.findById(movieId)
    .then((movie) => {
      if (movie) res.status(200).json(movie);
      else res.status(404).json({ message: 'Movie not found' });
    })
    .catch((err) => res.status(500).json({ message: 'Error retrieving movie', error: err }));
});

// Users Routes
// Register a new user
app.post(
  '/users/register',
  [
    check('Username').isLength({ min: 5 }).withMessage('Username must be at least 5 characters long.').isAlphanumeric(),
    check('Password', 'Password is required').not().isEmpty(),
    check('Email').isEmail().withMessage('Email is invalid.'),
    check('Birthday', 'Birthday is required').not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    try {
      let hashedPassword = await bcrypt.hash(req.body.Password, 10);
      let existingUser = await User.findOne({ Username: req.body.Username });
      if (existingUser) return res.status(400).send(`${req.body.Username} already exists`);

      let newUser = await User.create({
        Username: req.body.Username,
        Password: hashedPassword,
        Email: req.body.Email,
        Birthday: req.body.Birthday,
      });

      return res.status(201).json({
        Username: newUser.Username,
        Email: newUser.Email,
        Birthday: newUser.Birthday,
      });
    } catch (error) {
      console.error('Error during user registration:', error);
      return res.status(500).send('Error: ' + error);
    }
  }
);

// Get all users
app.get('/users', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Get a specific user by Username
app.get('/users/:Username', async (req, res) => {
  try {
    const user = await User.findOne({ Username: req.params.Username });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Get a specific user by ID
app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  try {
    const user = await User.findById(userId);
    if (user) res.status(200).json(user);
    else res.status(404).json({ message: 'User not found' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error: ' + err);
  }
});

// Login Route
app.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (error, user, info) => {
    if (error || !user) {
      return res.status(400).json({ message: 'Invalid username or password', user: 
