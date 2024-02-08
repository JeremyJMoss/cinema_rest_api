const express = require('express');
const {body} = require('express-validator');
const isAuth = require('../middleware/auth');
const movieController = require('../controllers/movie');
const {isValidDateFormat, isValidRating} = require('../util/validation');

const router = express.Router();

router.get('/movies', movieController.getAllMovies);

router.get('/actors', movieController.getAllActors);

router.post('/movie', [
    body('title').notEmpty().isString().trim().escape(),
    body('run_time').notEmpty().isInt().withMessage('Run time must be a whole number in minutes'),
    body('summary').notEmpty().isString().trim().escape(),
    body('release_date').notEmpty().custom(isValidDateFormat).withMessage('Release date must be in the "YYYY-MM-DD" format'),
    body('rating').notEmpty().custom(isValidRating).withMessage('Please enter a valid rating either G, PG, M, MA15+ or R18+'),
    body('director').optional().isString().trim().escape(),
    body('cover_art_url').optional().isURL(),
    body('cast').custom((actors, {req}) => {
        if (actors && Array.isArray(actors)) {
          // If cast array is present, validate and sanitize each element
          actors.forEach((actor, index) => {
            body(`cast[${index}].name`).notEmpty().isString().trim().escape();
            body(`cast[${index}].id`).optional().isInt();
          });
        }
        return true;
        }),
    ],
    isAuth, 
    movieController.createMovie
);

module.exports = router;