const express = require("express");
const router = express.Router();
const Movie = require("../models/Movie");

// 1. Get All Movies
router.get("/", async (req, res) => {
  try {
    const movies = await Movie.find();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Trending Movies
router.get("/trending", async (req, res) => {
  try {
    const movies = await Movie.find({ trending: true }).limit(10);
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Movies by Genre
router.get("/genre/:genre", async (req, res) => {
  try {
    const movies = await Movie.find({ genre: new RegExp(req.params.genre, "i") });
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Single Movie
router.get("/:movieId", async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.movieId);
    if (!movie) {
      return res.status(404).json({ error: "Movie not found" });
    }
    res.json(movie);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Add Movie (Admin)
router.post("/", async (req, res) => {
  try {
    const { title, genre, poster, rating, votes, description, language, duration, ageGroup } = req.body;

    const newMovie = new Movie({
      title,
      genre,
      poster,
      rating,
      votes,
      description,
      language,
      duration,
      ageGroup
    });

    await newMovie.save();
    res.status(201).json({ message: "Movie added successfully", movie: newMovie });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get 100+ Sample Movies (for initial data)
router.post("/seed/create-sample-movies", async (req, res) => {
  try {
    const sampleMovies = [
      { title: "Amaran", genre: "Action/Drama", rating: 9.1, votes: "18K", description: "An epic action drama", language: "Tamil", duration: "3h 15m", poster: "/images/A.jpeg", ageGroup: "UA" },
      { title: "Dhurandhar", genre: "Action/Thriller", rating: 9.7, votes: "3.1K", description: "Action thriller special", language: "Tamil", duration: "2h 45m", poster: "/images/D.jpeg", ageGroup: "UA" },
      { title: "Jana Nayagan", genre: "Drama/Social", rating: 9.0, votes: "12K", description: "Drama with social impact", language: "Tamil", duration: "2h 40m", poster: "/images/JN.jpeg", ageGroup: "UA" },
      { title: "Bison", genre: "Drama/Sports", rating: 8.2, votes: "55", description: "Sports drama", language: "Tamil", duration: "2h 30m", poster: "/images/bison.jpeg", ageGroup: "UA" },
      { title: "King of Kotha", genre: "Action/Crime/Drama", rating: 8.9, votes: "23.5K", description: "Crime drama thriller", language: "Tamil", duration: "2h 50m", poster: "/images/King%20of%20Kotha.jpeg", ageGroup: "A" },
      { title: "Sirai", genre: "Action/Drama/Crime", rating: 9.7, votes: "3.1K", description: "Crime action thriller", language: "Tamil", duration: "2h 35m", poster: "/images/sirai.jpeg", ageGroup: "UA" },
      { title: "Paradise", genre: "Action/Thriller", rating: 9.7, votes: "3.1K", description: "Thriller movie", language: "English", duration: "2h 45m", poster: "/images/Paradise.jpeg", ageGroup: "UA" },
      { title: "Parasakthi", genre: "Drama/Social", rating: 9.6, votes: "30K", description: "Social drama classic", language: "Tamil", duration: "3h", poster: "/images/parasakthi.jpeg", ageGroup: "UA" },
    ];

    // Generate 100+ movies by repeating with slight variations
    let allMovies = [];
    const genres = ["Action", "Drama", "Comedy", "Thriller", "Romance", "Horror", "Sci-Fi", "Fantasy"];
    const languages = ["Tamil", "English", "Hindi"];

    for (let i = 0; i < 100; i++) {
      const genre = genres[Math.floor(Math.random() * genres.length)];
      const language = languages[Math.floor(Math.random() * languages.length)];
      
      allMovies.push({
        title: `Movie ${i + 1}`,
        genre: genre,
        rating: (Math.random() * 5 + 5).toFixed(1),
        votes: `${Math.floor(Math.random() * 50)}K`,
        description: `${genre} movie with great storyline`,
        language: language,
        duration: `${2 + Math.floor(Math.random() * 2)}h ${Math.floor(Math.random() * 60)}m`,
        poster: `/images/movie-${i + 1}.jpg`,
        ageGroup: ["U", "UA", "A", "S"][Math.floor(Math.random() * 4)],
        trending: i < 10
      });
    }

    await Movie.insertMany(allMovies);
    res.json({ message: "100+ movies created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
