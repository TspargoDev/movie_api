const express = require('express');
const morgan = require('morgan');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const app = express();
const Models = require('./models.js'),
	Movie = Models.Movie,
	User = Models.User;
const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	passportJWT = require('passport-jwt');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');

app.use(cors());

let Users = Models.User,
	JWTStrategy = passportJWT.Strategy,
	ExtractJWT = passportJWT.ExtractJwt;

check(
	'Username',
	'Username contains non-alphanumeric characters - not allowed.'
).isAlphanumeric();

passport.use(
	new LocalStrategy(
		{
			usernameField: 'Username',
			passwordField: 'Password',
		},
		async (username, password, callback) => {
			console.log(`${username} ${password}`);
			await Users.findOne({ Username: username })
				.then((user) => {
					if (!user) {
						console.log('incorrect username');
						return callback(null, false, {
							message: 'Incorrect username or password.',
						});
					}
					console.log('finished');
					return callback(null, user);
				})
				.catch((error) => {
					if (error) {
						console.log(error);
						return callback(error);
					}
				});
		}
	)
);

passport.use(
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: 'your_jwt_secret',
		},
		async (jwtPayload, callback) => {
			return await Users.findById(jwtPayload._id)
				.then((user) => {
					return callback(null, user);
				})
				.catch((error) => {
					return callback(error);
				});
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
			console.log(`${username} ${password}`);
			await Users.findOne({ Username: username })
				.then((user) => {
					if (!user) {
						console.log('incorrect username');
						return callback(null, false, {
							message: 'Incorrect username or password.',
						});
					}
					if (!user.validatePassword(password)) {
						console.log('incorrect password');
						return callback(null, false, { message: 'Incorrect password.' });
					}
					console.log('finished');
					return callback(null, user);
				})
				.catch((error) => {
					if (error) {
						console.log(error);
						return callback(error);
					}
				});
		}
	)
);

app.use(
	'/favicon.ico',
	express.static(path.join(__dirname, 'public', 'favicon.ico'))
);

mongoose.connect(
	'mongodb+srv://movieADmin:IWAfTndNfIdEBSCygSGw@cluster0.zucea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
);

mongoose.connect(CONNECTION_URI, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

module.exports = (router) => {
	router.post('/login', (req, res) => {
		passport.authenticate('local', { session: false }, (error, user, info) => {
			if (error || !user) {
				return res.status(400).json({
					message: 'Something is not right',
					user: user,
				});
			}
			req.login(user, { session: false }, (error) => {
				if (error) {
					res.send(error);
				}
				let token = generateJWTToken(user.toJSON());
				return res.json({ user, token });
			});
		})(req, res);
	});
};

// Use morgan middleware to log requests to the terminal
app.use(morgan('combined'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);
			if (allowedOrigins.indexOf(origin) === -1) {
				// If a specific origin isn’t found on the list of allowed origins
				let message =
					'The CORS policy for this application doesn’t allow access from origin ' +
					origin;
				return callback(new Error(message), false);
			}
			return callback(null, true);
		},
	})
);

// Get all movies
app.get('/api/movies', (req, res) => {
	res.send('GET all movies');
});

// Get a specific movie by ID
app.get('/api/movies/:id', (req, res) => {
	const movieId = req.params.id;
	res.send(`GET movie with ID: ${movieId}`);
});

// Add a new movie
app.post('/api/movies', (req, res) => {
	res.send('POST new movie');
});

// Update an existing movie by ID
app.put('/api/movies/:id', (req, res) => {
	const movieId = req.params.id;
	res.send(`PUT update movie with ID: ${movieId}`);
});

// Delete a movie by ID
app.delete('/api/movies/:id', (req, res) => {
	const movieId = req.params.id;
	res.send(`DELETE movie with ID: ${movieId}`);
});

// Users API Routes

// Get all users
app.get('/api/users', (req, res) => {
	res.send('GET all users');
});

// Get a specific user by ID
app.get('/api/users/:id', (req, res) => {
	const userId = req.params.id;
	res.send(`GET user with ID: ${userId}`);
});

// Add a new user
//Add a user
/* We’ll expect JSON in this format
{
  ID: Integer,
  Username: String,
  Password: String,
  Email: String,
  Birthday: Date
}*/
app.post(
	'/users',
	async (req, res) =>
		// Validation logic here for request
		//you can either use a chain of methods like .not().isEmpty()
		//which means "opposite of isEmpty" in plain english "is not empty"
		//or use .isLength({min: 5}) which means
		//minimum value of 5 characters are only allowed
		[
			check('Username', 'Username is required').isLength({ min: 5 }),
			check(
				'Username',
				'Username contains non alphanumeric characters - not allowed.'
			).isAlphanumeric(),
			check('Password', 'Password is required').not().isEmpty(),
			check('Email', 'Email does not appear to be valid').isEmail(),
		],
	async (req, res) => {
		// check the validation object for errors
		let errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let hashedPassword = Users.hashPassword(req.body.Password);
		await Users.findOne({ Username: req.body.Username })
			.then((user) => {
				if (user) {
					return res.status(400).send(req.body.Username + 'already exists');
				} else {
					Users.create({
						Username: req.body.Username,
						Password: hashedPassword,
						Email: req.body.Email,
						Birthday: req.body.Birthday,
					})
						.then((user) => {
							res.status(201).json(user);
						})
						.catch((error) => {
							console.error(error);
							res.status(500).send('Error: ' + error);
						});
				}
			})
			.catch((error) => {
				console.error(error);
				res.status(500).send('Error: ' + error);
			});
	}
);

// Get all users
app.get('/users', async (req, res) => {
	await Users.find()
		.then((users) => {
			res.status(201).json(users);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});

app.get('/users/:Username', async (req, res) => {
	await Users.findOne({ Username: req.params.Username })
		.then((user) => {
			res.json(user);
		})
		.catch((err) => {
			console.error(err);
			res.status(500).send('Error: ' + err);
		});
});
// Update an existing user by ID
app.put('/api/users/:id', (req, res) => {
	const userId = req.params.id;
	res.send(`PUT update user with ID: ${userId}`);
});

// Delete a user by ID
app.delete('/api/users/:id', (req, res) => {
	const userId = req.params.id;
	res.send(`DELETE user with ID: ${userId}`);
});

app.get('/movies', (req, res) => {
	Movie.find()
		.then((movies) => res.status(200).json(movies))
		.catch((err) =>
			res.status(500).json({ message: 'Error retrieving movies', error: err })
		);
});

app.get('/movies/:title', (req, res) => {
	Movie.findOne({ title: req.params.title })
		.then((movie) => {
			if (movie) res.status(200).json(movie);
			else res.status(404).json({ message: 'Movie not found' });
		})
		.catch((err) =>
			res.status(500).json({ message: 'Error retrieving movie', error: err })
		);
});

app.get('/genres/:name', (req, res) => {
	Movie.findOne({ 'genre.name': req.params.name })
		.then((movie) => {
			if (movie) res.status(200).json(movie.genre);
			else res.status(404).json({ message: 'Genre not found' });
		})
		.catch((err) =>
			res.status(500).json({ message: 'Error retrieving genre', error: err })
		);
});

app.get('/directors/:name', (req, res) => {
	Movie.findOne({ 'director.first_name': req.params.name })
		.then((movie) => {
			if (movie) res.status(200).json(movie.director);
			else res.status(404).json({ message: 'Director not found' });
		})
		.catch((err) =>
			res.status(500).json({ message: 'Error retrieving director', error: err })
		);
});

app.post('/users', (req, res) => {
	const newUser = new User(req.body);
	newUser
		.save()
		.then((user) => res.status(201).json(user))
		.catch((err) =>
			res.status(500).json({ message: 'Error registering user', error: err })
		);
});

app.put('/users/:email', (req, res) => {
	User.findOneAndUpdate(
		{ email: req.params.email },
		{ $set: req.body },
		{ new: true }
	)
		.then((updatedUser) => res.status(200).json(updatedUser))
		.catch((err) =>
			res.status(500).json({ message: 'Error updating user info', error: err })
		);
});

app.post('/users/:email/movies/:movieTitle', (req, res) => {
	User.findOneAndUpdate(
		{ email: req.params.email },
		{ $addToSet: { favorite_movies: req.params.movieTitle } },
		{ new: true }
	)
		.then((updatedUser) => res.status(200).json(updatedUser))
		.catch((err) =>
			res
				.status(500)
				.json({ message: 'Error adding favorite movie', error: err })
		);
});

app.delete('/users/:email/movies/:movieTitle', (req, res) => {
	User.findOneAndUpdate(
		{ email: req.params.email },
		{ $pull: { favorite_movies: req.params.movieTitle } },
		{ new: true }
	)
		.then((updatedUser) => res.status(200).json(updatedUser))
		.catch((err) =>
			res
				.status(500)
				.json({ message: 'Error removing favorite movie', error: err })
		);
});

app.delete('/users/:email', (req, res) => {
	User.findOneAndDelete({ email: req.params.email })
		.then((deletedUser) => {
			if (deletedUser)
				res.status(200).json({ message: 'User deleted successfully' });
			else res.status(404).json({ message: 'User not found' });
		})
		.catch((err) =>
			res.status(500).json({ message: 'Error deleting user', error: err })
		);
});

app.get(
	'/movies',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		// Your logic to get movies
	}
);

// GET route for /
app.get('/', (req, res) => {
	res.send('Welcome to My Movie API! Access /movies to see my top 10 movies.');
});

// Simulate an error in one of the routes for testing
app.get('/error', (req, res) => {
	throw new Error('This is a simulated server error!');
});

// Error-handling middleware function
app.use((err, req, res, next) => {
	console.error(`Error: ${err.message}`); // Log the error to the terminal

	// Send error response to the client
	res.status(500).json({
		message: 'An internal server error occurred!',
		error: err.message,
	});
});

const host = '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port, host, function () {
	console.log('Server started.......');
});
