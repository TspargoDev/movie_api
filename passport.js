const passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	Models = require('./models.js'),
	passportJWT = require('passport-jwt');

let Users = Models.User,
	JWTStrategy = passportJWT.Strategy,
	ExtractJWT = passportJWT.ExtractJwt;

passport.use(
	new LocalStrategy(
		{
			usernameField: 'username',
			passwordField: 'password',
		},
		async (username, password, callback) => {
			try {
				console.log(`Attempting to authenticate user: ${username}`);

				const user = await Users.findOne({ username: username });
				if (!user) {
					console.log('Incorrect username');
					return callback(null, false, {
						message: 'Incorrect username or password.',
					});
				}

				// Validate password
				const isValidPassword = await user.validatePassword(password);
				if (!isValidPassword) {
					console.log('Incorrect password');
					return callback(null, false, { message: 'Incorrect password.' });
				}

				console.log('Authentication successful');
				return callback(null, user);
			} catch (error) {
				console.log('Error in LocalStrategy:', error);
				return callback(error);
			}
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
			try {
				const user = await Users.findById(jwtPayload._id);
				if (!user) {
					console.log('User not found in JWT strategy');
					return callback(null, false, { message: 'User not found' });
				}

				console.log('User found in JWT strategy');
				return callback(null, user);
			} catch (error) {
				console.log('Error in JWTStrategy:', error);
				return callback(error);
			}
		}
	)
);
