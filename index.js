const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const passport = require('passport');
require('./passport');
const { check, validationResult } = require('express-validator');
const auth = require('./auth');

const app = express();
const Models = require('./models.js');

const Movie = Models.Movie;

const User = Models.User;
// Middleware setup
app.use(cors());
auth(app);
app.use(express.json());
app.use(morgan('common'));
app.use(bodyParser());
app.use(
	'/favicon.ico',
	express.static(path.join(__dirname, 'public', 'favicon.ico'))
);
app.use(express.static(path.join(__dirname, 'public')));
// expressApp.use(express.static(path.join(__dirname, 'public')));
let allowedOrigins = [
	'http://localhost:3000',
	'https://myflixtspargo.netlify.app/',
];
// Database connection
mongoose.connect(
	'mongodb+srv://movieADmin:IWAfTndNfIdEBSCygSGw@cluster0.zucea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
	{ useNewUrlParser: true, useUnifiedTopology: true }
);

// Routes

// Get all movies
app.get('/movies', async (req, res) => {
	try {
		const movies = await Movies.find(); // Fetch all movies from MongoDB
		if (!movies.length) {
			return res.status(404).send('No movies found');
		}
		res.status(200).json(movies);
	} catch (err) {
		console.error(err);
		res.status(500).send('Error fetching movies');
	}
});

// Return data about a single movie by title
app.get(
	'/movies/:title',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOne({ title: req.params.title })
			.then((movie) => {
				if (!movie) {
					res.status(404).send('Movie not found');
				} else {
					res.json(movie);
				}
			})
			.catch((err) => res.status(500).send('Error: ' + err));
	}
);

// Return data about a genre by name
app.get(
	'/genres/:name',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOne({ 'genre.name': req.params.name })
			.then((movie) => {
				if (!movie) {
					res.status(404).send('Genre not found');
				} else {
					res.json(movie.genre);
				}
			})
			.catch((err) => res.status(500).send('Error: ' + err));
	}
);

// Return data about a director by name
app.get(
	'/directors/:name',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		await Movies.findOne({ 'director.name': req.params.name })
			.then((movie) => {
				if (!movie) {
					res.status(404).send('Director not found');
				} else {
					res.json(movie.director);
				}
			})
			.catch((err) => res.status(500).send('Error: ' + err));
	}
);

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
