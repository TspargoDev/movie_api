# myFlix Movie API

Welcome to the myFlix Movie API! This API powers the backend of the myFlix movie application. It provides movie, director, and genre information and allows users to manage their profiles and favorite movies. Built with the MERN stack (MongoDB, Express, React, Node.js), this API is designed to serve all the needs of movie enthusiasts and frontend developers building the client-side of the app.

## Project Overview

**Objective**
I built the myFlix Movie API to deliver data related to movies, directors, and genres. It allows users to sign up, manage their profile, and save their favorite movies. The API is structured as a RESTful service with various endpoints to manage user data and movie-related information.

**Goals**

- Provide Movie Data: The API returns all the necessary movie details, such as titles, descriptions, genres, and more.
- User Profiles: Users can register, update their details, and save movies they like to their favorite list.
- RESTful Design: I’ve followed best practices for building RESTful APIs, ensuring smooth communication between the client and server.

## Key Features

**Essential Features**

1. Movies

- Fetch a list of all movies.
- Get detailed information about a specific movie by its title (description, genre, director, image URL, and more).

2. Genres

- Retrieve information about a genre (description) by its name.

3. Directors

- Get director details (bio, birth year, and death year) by name.

4. User Management

- Register a new user.
- Update user details (e.g., username, email, password, and date of birth).
- Add and remove movies from the user's list of favorites.
- Deregister a user account when they no longer wish to use the app.

# Technical Requirements

- Server Framework: Built using Node.js and Express.
- Architecture: RESTful API with a clean and consistent URL endpoint structure.
- Middleware: Uses essential middleware (like body-parser and morgan) to manage requests and logging.
- Database: MongoDB with Mongoose to store and manage movie, director, and user data.
- Data Format: All responses are in JSON format to make it easy for the frontend to integrate.
- Error Handling: The code is carefully designed to be error-free and handle edge cases.
- Testing: I’ve used Postman to thoroughly test all API endpoints before deployment.
- Security: The API includes authentication (JWT tokens) and data validation to ensure user data is secure.

## How to Run Locally

If you want to run the myFlix Movie API locally, follow these steps:

**Clone the Repository**

```bash
git clone https://github.com/yourusername/myflix-api.git
cd myflix-api
```

**Install Dependencies**

```bash
npm install
```

**Set Up MongoDB**

- Connect to your MongoDB instance (local or cloud-based).
- Create a .env file and add your MongoDB connection string.

**Run the Server**

```bash
npm start
```

**Test the API**
Open Postman or your API testing tool to verify the endpoints are working correctly.

## API Endpoints

Here’s a list of the available API endpoints and their descriptions:

| Endpoint                      | Method | Description                            |
| ----------------------------- | ------ | -------------------------------------- |
| `/movies`                     | GET    | Get all movies                         |
| `/movies/:title`              | GET    | Get a specific movie by title          |
| `/genres/:name`               | GET    | Get details about a genre              |
| `/directors/:name`            | GET    | Get details about a director           |
| `/users`                      | POST   | Register a new user                    |
| `/users/:username`            | PUT    | Update user details                    |
| `/users/:username/movies/:id` | POST   | Add a movie to a user's favorites      |
| `/users/:username/movies/:id` | DELETE | Remove a movie from a user's favorites |
| `/users/:username`            | DELETE | Deregister a user account              |

## Technologies Used

- Backend: Node.js, Express
- Database: MongoDB with Mongoose ORM
- Authentication: JWT (JSON Web Tokens)
- Testing: Postman
- Deployment: Heroku
- Middleware: body-parser, morgan, and other Express middleware

I hope this API helps you build a seamless experience for your users! Feel free to use or contribute to this project.
