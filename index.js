const express = require('express');
const morgan = require('morgan');
const path = require('path');

const app = express();

// Use morgan middleware to log requests to the terminal
app.use(morgan('combined'));

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

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
