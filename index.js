const express = require("express");
const morgan = require("morgan");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Models = require("./models.js");
const passport = require("passport");
const cors = require("cors");
const { check, validationResult } = require("express-validator");

const Movies = Models.Movie;
const Users = Models.User;

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("common"));
app.use(cors());
app.use(express.static("public"));

const auth = require("./auth");
require("./passport");

// Connect to MongoDB
mongoose
	.connect(process.env.MONGOOSE_DATA, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	})
	.then(() => console.log("MongoDB connected"))
	.catch((error) => {
		console.error("MongoDB connection error:", error);
		process.exit(1);
	});

// Routes

// Get all movies
app.get(
	"/movies",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const movies = await Movies.find();
			res.status(200).json(movies);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err.message);
		}
	}
);

// Get movie by ID
app.get(
	"/movies/:id",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const movie = await Movies.findById(req.params.id);
			if (!movie) return res.status(404).send("Movie not found");
			res.json(movie);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err.message);
		}
	}
);

// Register new user
app.post(
	"/users",
	[
		check("username", "Username is required").isLength({ min: 5 }),
		check(
			"username",
			"Username contains non alphanumeric characters - not allowed."
		).isAlphanumeric(),
		check("password", "Password is required").not().isEmpty(),
		check("email", "Email does not appear to be valid").isEmail(),
	],
	async (req, res) => {
		let errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		let hashedPassword = Users.hashPassword(req.body.password);
		try {
			const user = await Users.findOne({ username: req.body.username });
			if (user) {
				return res.status(400).send(req.body.username + " already exists");
			} else {
				const newUser = await Users.create({
					username: req.body.username,
					password: hashedPassword,
					email: req.body.email,
					birthday: req.body.birthday,
				});
				const userWithoutPassword = newUser.toJSON();
				delete userWithoutPassword.password;
				res.status(201).json(userWithoutPassword);
			}
		} catch (error) {
			console.error(error);
			res.status(500).send("Error: " + error);
		}
	}
);

// Update user info
app.put(
	"/users/:username",
	passport.authenticate("jwt", { session: false }),
	[
		check("username", "Username is required").isLength({ min: 5 }),
		check(
			"username",
			"Username contains non alphanumeric characters - not allowed."
		).isAlphanumeric(),
		check("password", "Password is required").not().isEmpty(),
		check("email", "Email does not appear to be valid").isEmail(),
	],
	async (req, res) => {
		let errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		// Check if the authenticated user matches the username parameter
		if (req.user.username !== req.params.username) {
			return res.status(403).send("Permission denied");
		}

		let hashedPassword = Users.hashPassword(req.body.password);

		try {
			const updatedUser = await Users.findOneAndUpdate(
				{ username: req.params.username },
				{
					$set: {
						username: req.body.username,
						password: hashedPassword,
						email: req.body.email,
						birthday: req.body.birthday,
					},
				},
				{ new: true }
			);
			if (!updatedUser) {
				return res.status(404).send("User not found");
			}
			res.json(updatedUser);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err.message);
		}
	}
);

// Add movie to user's favorites
app.post(
	"/users/:username/movies/:movieId",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			if (req.user.username !== req.params.username) {
				return res.status(403).send("Permission denied");
			}

			const updatedUser = await Users.findOneAndUpdate(
				{ username: req.params.username },
				{ $addToSet: { favoriteMovies: req.params.movieId } }, // prevents duplicates
				{ new: true }
			);

			if (!updatedUser) {
				return res.status(404).send("User not found");
			}

			res.json(updatedUser);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err.message);
		}
	}
);

// Remove movie from user's favorites
app.delete(
	"/users/:username/movies/:movieId",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			if (req.user.username !== req.params.username) {
				return res.status(403).send("Permission denied");
			}

			const updatedUser = await Users.findOneAndUpdate(
				{ username: req.params.username },
				{ $pull: { favoriteMovies: req.params.movieId } },
				{ new: true }
			);

			if (!updatedUser) {
				return res.status(404).send("User not found");
			}

			res.json(updatedUser);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err.message);
		}
	}
);

// Delete user
app.delete(
	"/users/:username",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			if (req.user.username !== req.params.username) {
				return res.status(403).send("Permission denied");
			}

			const user = await Users.findOneAndRemove({
				username: req.params.username,
			});
			if (!user) {
				return res.status(404).send(req.params.username + " was not found");
			}
			res.status(200).send(req.params.username + " was deleted.");
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err.message);
		}
	}
);

app.post(
	"/login",
	[
		check("Username", "Username is required").not().isEmpty(),
		check("Password", "Password is required").not().isEmpty(),
	],
	auth.login
);

const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
	console.log("Listening on Port " + port);
});
