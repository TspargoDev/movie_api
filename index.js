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

// Connect to MongoDB
mongoose.connect(
	"mongodb+srv://movieADmin:IWAfTndNfIdEBSCygSGw@cluster0.zucea.mongodb.net/movieDB?retryWrites=true&w=majority&appName=Cluster0",
	{ useNewUrlParser: true, useUnifiedTopology: true }
);

// Auth
require("./passport");
const auth = require("./auth");
auth(app);

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
			res.status(500).send("Error: " + err);
		}
	}
);

// Get movie by title
app.get(
	"/movies/:title",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const movie = await Movies.findOne({ title: req.params.title });
			res.json(movie);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err);
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
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		const hashedPassword = Users.hashPassword(req.body.password);

		try {
			const user = await Users.findOne({ username: req.body.username });
			if (user) {
				return res.status(400).send(req.body.username + " already exists");
			}
			const newUser = await Users.create({
				username: req.body.username,
				password: hashedPassword,
				email: req.body.email,
				birthday: req.body.birthday,
			});
			const userWithoutPassword = newUser.toJSON();
			delete userWithoutPassword.password;
			res.status(201).json(userWithoutPassword);
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
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(422).json({ errors: errors.array() });
		}

		const hashedPassword = Users.hashPassword(req.body.password);

		if (req.user.username !== req.params.username) {
			return res.status(400).send("Permission denied");
		}

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
			res.json(updatedUser);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err);
		}
	}
);

// Add movie to user's favorites
app.post(
	"/users/:username/movies/:movieId",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const updatedUser = await Users.findOneAndUpdate(
				{ username: req.params.username },
				{ $push: { favoriteMovies: req.params.movieId } },
				{ new: true }
			);
			res.json(updatedUser);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err);
		}
	}
);

// Remove movie from user's favorites
app.delete(
	"/users/:username/movies/:movieId",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const updatedUser = await Users.findOneAndUpdate(
				{ username: req.params.username },
				{ $pull: { favoriteMovies: req.params.movieId } },
				{ new: true }
			);
			res.json(updatedUser);
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err);
		}
	}
);

// Delete user
app.delete(
	"/users/:username",
	passport.authenticate("jwt", { session: false }),
	async (req, res) => {
		try {
			const user = await Users.findOneAndRemove({
				username: req.params.username,
			});
			if (!user) {
				return res.status(400).send(req.params.username + " was not found");
			}
			res.status(200).send(req.params.username + " was deleted.");
		} catch (err) {
			console.error(err);
			res.status(500).send("Error: " + err);
		}
	}
);

// Login endpoint
app.post(
	"/login",
	[
		check("Username", "Username is required").not().isEmpty(),
		check("Password", "Password is required").not().isEmpty(),
	],
	auth.login
);

// Start server
const port = process.env.PORT || 8080;
app.listen(port, "0.0.0.0", () => {
	console.log("Listening on Port " + port);
});
