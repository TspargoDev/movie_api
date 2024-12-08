const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const passport = require('passport');
const { check, validationResult } = require('express-validator');
const expressApp = require('./auth');

const app = express();
const Models = require('./models.js');

const Movie = Models.Movie;
const User = Models.User;

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));
app.use(
	'/favicon.ico',
	express.static(path.join(__dirname, 'public', 'favicon.ico'))
);
app.use(express.static(path.join(__dirname, 'public')));
expressApp.use(express.static(path.join(__dirname, 'public')));

// Database connection
mongoose.connect(
	'mongodb+srv://movieADmin:IWAfTndNfIdEBSCygSGw@cluster0.zucea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
	{ useNewUrlParser: true, useUnifiedTopology: true }
);

// Routes

// Get all movies
app.get('/api/movies', async (req, res) => {
	try {
		const movies = await Movie.find();
		res.status(200).json(movies);
	} catch (err) {
		res.status(500).json({ message: 'Error retrieving movies', error: err });
	}
});

// Get a specific movie by ID
app.get('/api/movies/:id', async (req, res) => {
	try {
		const movie = await Movie.findById(req.params.id);
		movie
			? res.status(200).json(movie)
			: res.status(404).json({ message: 'Movie not found' });
	} catch (err) {
		res.status(500).json({ message: 'Error retrieving movie', error: err });
	}
});

// Register a new user
app.post(
	'/users',
	[
		check('Username')
			.isLength({ min: 4 })
			.withMessage('Username must be at least 4 characters long.')
			.isAlphanumeric()
			.withMessage('Username can only contain letters and numbers.'),
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
			// Validate if request body exists and has valid structure
			if (!req.body || typeof req.body !== 'object') {
				return res.status(400).json({ message: 'Invalid request body format' });
			}

			const { Username, Password, Email, Birthday } = req.body;

			// Log the incoming data for debugging
			console.log('Received user registration data:', req.body);

			// Hash the password
			const hashedPassword = await bcrypt.hash(Password, 10);

			// Check if the username already exists
			const existingUser = await User.findOne({ Username });
			if (existingUser) {
				return res.status(400).json({ message: `${Username} already exists` });
			}

			// Create a new user
			const newUser = await User.create({
				Username,
				Password: hashedPassword,
				Email,
				Birthday,
			});

			// Return the newly created user (exclude sensitive data like Password)
			res.status(201).json({
				Username: newUser.Username,
				Email: newUser.Email,
				Birthday: newUser.Birthday,
			});
		} catch (error) {
			console.error('Error during user registration:', error);
			res
				.status(500)
				.json({ message: 'Internal server error', error: error.message });
		}
	}
);

// Get all users
app.get(
	'/users',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		try {
			const users = await User.find();
			res.status(200).json(users);
		} catch (err) {
			res.status(500).send('Error: ' + err);
		}
	}
);

// Get user by ID
app.get('/users/:id', async (req, res) => {
	try {
		const user = await User.findById(req.params.id);
		user
			? res.status(200).json(user)
			: res.status(404).json({ message: 'User not found' });
	} catch (err) {
		res.status(500).send('Error: ' + err);
	}
});

// Update user by ID
app.put('/users/:id', async (req, res) => {
	try {
		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{ $set: req.body },
			{ new: true }
		);
		res.status(200).json(updatedUser);
	} catch (err) {
		res.status(500).json({ message: 'Error updating user info', error: err });
	}
});

// Add movie to user's favorites
app.post('/users/:id/movies/:movieId', async (req, res) => {
	try {
		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{ $addToSet: { favorite_movies: req.params.movieId } },
			{ new: true }
		);
		res.status(200).json(updatedUser);
	} catch (err) {
		res
			.status(500)
			.json({ message: 'Error adding favorite movie', error: err });
	}
});

// Remove movie from user's favorites
app.delete('/users/:id/movies/:movieId', async (req, res) => {
	try {
		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{ $pull: { favorite_movies: req.params.movieId } },
			{ new: true }
		);
		res.status(200).json(updatedUser);
	} catch (err) {
		res
			.status(500)
			.json({ message: 'Error removing favorite movie', error: err });
	}
});

// Delete a user by ID
app.delete('/users/:id', async (req, res) => {
	try {
		const deletedUser = await User.findByIdAndDelete(req.params.id);
		deletedUser
			? res.status(200).json({ message: 'User deleted successfully' })
			: res.status(404).json({ message: 'User not found' });
	} catch (err) {
		res.status(500).json({ message: 'Error deleting user', error: err });
	}
});

// Root route
app.get('/', (req, res) => {
	res.send('Welcome to My Movie API! Access /movies to see my top 10 movies.');
});

// Simulated error route
app.get('/error', (req, res) => {
	throw new Error('This is a simulated server error!');
});

// Error-handling middleware
app.use((err, req, res, next) => {
	console.error(`Error: ${err.message}`);
	res.status(500).json({
		message: 'An internal server error occurred!',
		error: err.message,
	});
});

// Start server
app.listen(process.env.PORT || 3000, function () {
	console.log(
		'Express server listening on port %d in %s mode',
		this.address().port,
		app.settings.env
	);
});
