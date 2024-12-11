let mongoose = require('mongoose');
let bcrypt = require('bcrypt');

let movieSchema = mongoose.Schema({
	Title: { type: String, required: true },
	Description: { type: String, required: true },
	Genre: {
		Name: String,
		Description: String,
	},
	Director: {
		Name: String,
		Bio: String,
		BirthDate: Date,
	},
	Actors: [String],
	ImagaPath: String,
	Featured: Boolean,
});

let userSchema = mongoose.Schema({
	Username: { type: String, required: true },
	Password: { type: String, required: true },
	Email: { type: String, required: true },
	Birthday: Date,
	FavoriteMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
});

// Hash password before saving
userSchema.pre('save', function (next) {
	if (this.isModified('Password') || this.isNew) {
		this.Password = bcrypt.hashSync(this.Password, 10); // Hash password
	}
	next();
});

// Static method to hash password
userSchema.statics.hashPassword = (Password) => {
	return bcrypt.hashSync(Password, 10);
};

// Instance method to validate password
userSchema.methods.validatePassword = function (Password) {
	return bcrypt.compareSync(Password, this.Password); // Compare hashed password
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;
