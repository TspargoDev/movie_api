const jwtSecret = 'your_jwt_secret'; // This has to be the same key used in the JWTStrategy
const jwt = require('jsonwebtoken');
const passport = require('passport');
//const express = require('express');
//const expressApp = express(); // Declare and initialize expressApp here

require('./passport');

let generateJWTToken = (user) => {
	return jwt.sign(user, jwtSecret, {
		subject: user.Username, // Username will be the subject claim
		expiresIn: '7d', // Token expires in 7 days
		algorithm: 'HS256', // Signing algorithm
	});
};

/* POST login */
module.exports = (expressApp) => {
	expressApp.post('/login', (req, res) => {
		passport.authenticate('local', { session: false }, (error, user, info) => {
			if (error) {
				console.error('Authentication error:', error);
				return res.status(400).json({
					message: 'Authentication failed. Please check your credentials.',
					user: user || null, // If user is not found, null will be returned
				});
			}

			// Use req.login to initialize the login process with session=false
			req.login(user, { session: false }, (error) => {
				if (error) {
					return res.status(500).json({
						message: 'Error logging in user.',
						error: error,
					});
				}

				// Generate JWT token after successful login

				const token = generateJWTToken(user.toJSON());

				return res.json({ user, token });
			});
		})(req, res); // Ensure passport is called with req and res
	});
};
