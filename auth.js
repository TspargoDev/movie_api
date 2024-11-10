const jwtSecret = 'your_jwt_secret'; // This has to be the same key used in the JWTStrategy
const jwt = require('jsonwebtoken');
const passport = require('passport');
const express = require('express');
const app = express(); // Express instance

require('./passport'); // Assuming passport.js file is configured properly

let generateJWTToken = (user) => {
	return jwt.sign(user, jwtSecret, {
		subject: user.Username, // Username will be the subject claim
		expiresIn: '7d', // Token expires in 7 days
		algorithm: 'HS256', // Signing algorithm
	});
};

/* POST login */
app.post('/login', (req, res) => {
	passport.authenticate('local', { session: false }, (error, user, info) => {
		if (error || !user) {
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
			const token = generateJWTToken(user.toJSON()); // Convert user to JSON for JWT
			return res.json({
				message: 'Login successful!',
				user: user,
				token: token,
			});
		});
	})(req, res); // Ensure passport is called with req and res
});

// Export the app object to index.js
module.exports = { expressApp };
