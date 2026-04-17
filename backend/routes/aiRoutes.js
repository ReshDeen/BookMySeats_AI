const express = require('express');
const router = express.Router();
const { recommendMovies } = require('../controllers/chatController');

router.post('/recommend', recommendMovies);

module.exports = router;
