const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	Models = require('./models.js'),
	passportJWT = require('passport-jwt'),
	Users = Models.User,
	JWTStrategy = passportJWT.Strategy,
	ExtractJWT = passportJWT.ExtractJwt;

// Local Strategy for login (username and password)
passport.use(
	new LocalStrategy(
		{
			usernameField: 'Username',
			passwordField: 'Password',
		},
		async (username, password, callback) => {
			console.log(`${username} ${password}`); // Corrected template literal

			try {
				// Find user by username
				const user = await Users.findOne({ Username: username });

				// If user doesn't exist
				if (!user) {
					console.log('Incorrect username');
					return callback(null, false, {
						message: 'Incorrect username or password',
					});
				}

				// Check password validity
				if (!user.validatePassword(password)) {
					console.log('Incorrect password');
					return callback(null, false, { message: 'Incorrect password.' });
				}

				console.log('Authentication successful');
				return callback(null, user); // User authenticated successfully
			} catch (error) {
				console.log(error);
				return callback(error); // If there's any error, return it
			}
		}
	)
);

// JWT Strategy for verifying JWT token in request headers
passport.use(
	new JWTStrategy(
		{
			jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(), // Extract JWT from the authorization header
			secretOrKey: 'your_jwt_secret', // Secret key for JWT verification
		},
		async (jwtPayload, callback) => {
			try {
				// Find user based on the payload ID
				const user = await Users.findById(jwtPayload._id);
				if (!user) {
					console.log('User not found');
					return callback(null, false, { message: 'User not found' });
				}

				console.log('JWT Authentication successful');
				return callback(null, user); // If user found, pass to next middleware
			} catch (error) {
				console.log(error);
				return callback(error); // Return error if any issue
			}
		}
	)
);
