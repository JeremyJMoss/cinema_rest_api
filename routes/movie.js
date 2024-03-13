const express = require('express');
const {body} = require('express-validator');
const isAuth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const movieController = require('../controllers/movie');
const {isValidDateFormat, isValidRating} = require('../util/validation');

const router = express.Router();

router.get('/movies', movieController.getAllMovies);

router.get('/current-movies', movieController.getAllCurrentMoviesWithSessions);

router.get('/movie/:id', movieController.getMovie);

router.get('/movies/search', movieController.getMoviesBySearchQuery);

router.get('/actors', movieController.getAllActors);

router.get('/actor/movies/:actorId', movieController.getActorMovies);

router.post('/movie', [
    body('title').notEmpty().isString().trim().escape(),
    body('run_time').notEmpty().isInt().withMessage('Run time must be a whole number in minutes'),
    body('summary').notEmpty().isString().trim().escape(),
    body('release_date').notEmpty().custom(isValidDateFormat).withMessage('Release date must be in the "YYYY-MM-DD" format'),
    body('rating').notEmpty().custom(isValidRating).withMessage('Please enter a valid rating either G, PG, M, MA15+ or R18+'),
    body('director').optional().isString().trim().escape(),
    body('cast').custom((actors, {req}) => {
        if (actors && Array.isArray(actors)) {
          // If cast array is present, validate and sanitize each element
          actors.forEach((_, index) => {
            body(`cast[${index}].name`).notEmpty().isString().trim().escape();
            body(`cast[${index}].id`).optional().isInt();
          });
        }
        return true;
        }),
    ],
    isAuth,
    isAdmin,
    movieController.createMovie
);

router.put('/movie/:id', [
    body('title').notEmpty().isString().trim().escape(),
    body('run_time').notEmpty().isInt().withMessage('Run time must be a whole number in minutes'),
    body('summary').notEmpty().isString().trim().escape(),
    body('release_date').notEmpty().custom(isValidDateFormat).withMessage('Release date must be in the "YYYY-MM-DD" format'),
    body('rating').notEmpty().custom(isValidRating).withMessage('Please enter a valid rating either G, PG, M, MA15+ or R18+'),
    body('director').optional().isString().trim().escape(),
    body('cast').custom((actors, { req }) => {
      // comes as form data so will need to be parsed manually
      actors = JSON.parse(actors);
      if (actors && Array.isArray(actors)) {
        // If cast array is present, validate and sanitize each element
        actors.forEach((_, index) => {
          body(`cast[${index}].name`).notEmpty().isString().trim().escape();
          body(`cast[${index}].id`).optional().isInt();
        });
      }
      return true;
    }),
    ],
    isAuth,
    isAdmin,
    movieController.updateMovie
);

router.delete('/movie/:id', isAuth, isAdmin, movieController.deleteMovie);

module.exports = router;