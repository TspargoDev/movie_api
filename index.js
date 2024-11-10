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
app.use(express.json()); // Ensure you can parse JSON

let Users = Models.User,
	JWTStrategy = passportJWT.Strategy,
	ExtractJWT = passportJWT.ExtractJwt;

check(
	'Username',
	'Username contains non-alphanumeric characters - not allowed.'
).isAlphanumeric();

passport.use(
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
			secretOrKey: 'your_jwt_secret',
		},
		async (jwtPayload, callback) => {
			try {
				const user = await Users.findById(jwtPayload._id);
				return callback(null, user);
			} catch (error) {
				return callback(error, null);
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
				const user = await Users.findOne({ Username: username });
				if (!user) {
					return callback(null, false, {
						message: 'Incorrect Username or Password.',
					});
				}
				if (!(await user.validatePassword(password))) {
					return callback(null, false, { message: 'Incorrect Password' });
				}
				return callback(null, user);
			} catch (error) {
				return callback(error);
			}
		}
	)
);

app.use(morgan('combined'));
app.use(express.static(path.join(__dirname, 'public')));

// Database connection
mongoose.connect(
	'mongodb+srv://movieADmin:IWAfTndNfIdEBSCygSGw@cluster0.zucea.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0',
	{
		useNewUrlParser: true,
		useUnifiedTopology: true,
	}
);

const generateJWTToken = (user) => {
	const jwt = require('jsonwebtoken');
	return jwt.sign(user, 'your_jwt_secret', { expiresIn: '1h' });
};

// User Registration
app.post(
	'/users/register',
	[
		check('Username')
			.isLength({ min: 5 })
			.withMessage('Username must be at least 5 characters long.')
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
			let hashedPassword = await bcrypt.hash(req.body.Password, 10);
			let existingUser = await Users.findOne({ Username: req.body.Username });
			if (existingUser) {
				return res.status(400).send(req.body.Username + ' already exists');
			}

			let newUser = await Users.create({
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

// User Login Route
app.post('/login', (req, res, next) => {
	passport.authenticate('local', { session: false }, (error, user, info) => {
		if (error || !user) {
			return res.status(400).json({
				message: 'Invalid username or password',
				user: user,
			});
		}
		req.login(user, { session: false }, (error) => {
			if (error) {
				return res.send(error);
			}
			let token = generateJWTToken(user.toJSON());
			return res.json({ user, token });
		});
	})(req, res, next);
});

// Movies API Routes
app.get(
	'/movies',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movie.find()
			.then((movies) => res.status(200).json(movies))
			.catch((err) =>
				res.status(500).json({ message: 'Error retrieving movies', error: err })
			);
	}
);

app.get(
	'/movies/:title',
	passport.authenticate('jwt', { session: false }),
	(req, res) => {
		Movie.findOne({ title: req.params.title })
			.then((movie) => {
				if (movie) res.status(200).json(movie);
				else res.status(404).json({ message: 'Movie not found' });
			})
			.catch((err) =>
				res.status(500).json({ message: 'Error retrieving movie', error: err })
			);
	}
);

// Users Routes
app.get(
	'/users',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		try {
			const users = await Users.find();
			res.json(users);
		} catch (err) {
			console.error(err);
			res.status(500).send('Error: ' + err);
		}
	}
);

app.get(
	'/users/:Username',
	passport.authenticate('jwt', { session: false }),
	async (req, res) => {
		try {
			const user = await Users.findOne({ Username: req.params.Username });
			if (user) {
				res.json(user);
			} else {
				res.status(404).send('User not found');
			}
		} catch (err) {
			console.error(err);
			res.status(500).send('Error: ' + err);
		}
	}
);

// Error-handling middleware
app.use((err, req, res, next) => {
	console.error(`Error: ${err.message}`); // Log the error
	res.status(500).json({
		message: 'An internal server error occurred!',
		error: err.message,
	});
});

// Start server
app.listen(process.env.PORT || 3000, () => {
	console.log(
		'Express server listening on port %d in %s mode',
		this.address().port,
		app.settings.env
	);
});
