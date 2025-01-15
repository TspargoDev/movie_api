const jwtSecret = "your_jwt_secret"; // This has to be the same key used in the JWTStrategy
const jwt = require("jsonwebtoken");
const passport = require("passport");

require("./passport");

const generateJWTToken = (user) => {
  return jwt.sign(user, jwtSecret, {
    subject: user.username,
    expiresIn: "7d",
    algorithm: "HS256",
  });
};

const login = (req, res) => {
  passport.authenticate("local", { session: false }, (error, user, info) => {
    if (error || !user) {
      console.log("Authentication error:", error);
      console.log("User:", user);
      console.log("Info:", info);
      return res.status(400).json({
        message: "Something is not right",
        user: user,
      });
    }
    req.login(user, { session: false }, (error) => {
      if (error) {
        console.log("Login error:", error);
        res.send(error);
      }
      let token = generateJWTToken(user.toJSON());
      return res.json({ user, token });
    });
  })(req, res);
};

module.exports = {
  login: login,
};
