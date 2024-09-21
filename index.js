const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Use morgan middleware to log requests to the terminal
app.use(morgan('combined'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

const bodyParser = require('body-parser');

// GET route for /movies
app.get('/movies', (req, res) => {
	const topMovies = [
		{ title: 'The Shawshank Redemption', year: 1994, rating: 9.3 },
		{ title: 'The Godfather', year: 1972, rating: 9.2 },
		{ title: 'The Dark Knight', year: 2008, rating: 9.0 },
		{ title: 'The Godfather: Part II', year: 1974, rating: 9.0 },
		{ title: '12 Angry Men', year: 1957, rating: 9.0 },
		{ title: "Schindler's List", year: 1993, rating: 8.9 },
		{
			title: 'The Lord of the Rings: The Return of the King',
			year: 2003,
			rating: 8.9,
		},
		{ title: 'Pulp Fiction', year: 1994, rating: 8.9 },
		{ title: 'The Good, the Bad and the Ugly', year: 1966, rating: 8.8 },
		{ title: 'Fight Club', year: 1999, rating: 8.8 },
	];

	res.json({
		message: 'Here are the top 10 movies:',
		movies: topMovies,
	});
});

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
app.post('/api/users', (req, res) => {
	res.send('POST new user');
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

// Start the server on port 8000
const port = 8000;
app.listen(port, () => {
	console.log(`Server is running on http://localhost:${port}`);
});
