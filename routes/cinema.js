const express = require('express');
const {body} = require('express-validator');
const isAuth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const cinemaController = require('../controllers/cinema');
const { isValidTheatreType, isValidDateFormat, isValidTimeFormat } = require('../util/validation');

const router = express.Router();

router.get('/cinemas', cinemaController.getAllCinemas);

router.get('/cinema/:id', cinemaController.getCinema);

router.get('/theatres/:cinema_id', cinemaController.getAllTheatresByCinema);

router.get('/sessions', cinemaController.getAllSessionsByTheatre);

router.post('/cinema', [
    body('name').notEmpty().isString().trim().escape(),
    body('country').notEmpty().isString().trim().escape(),
    body('streetAddress').notEmpty().isString().trim().escape(),
    body('designator').optional().isString().trim().escape(),
    body('city').notEmpty().isString().trim().escape(),
    body('state').notEmpty().isString().trim().escape(),
    body('postcode').notEmpty().isInt()
],
isAuth,
isAdmin,
cinemaController.createCinema
)

router.post('/theatre', [
    body('cinema_id').notEmpty().isInt(),
    body('theatre_number').notEmpty().isInt(),
    body('theatre_type').notEmpty().custom(isValidTheatreType).withMessage('Theatre types must be either Gold Class, Standard, V-Max, Drive-In'),
],
isAuth,
isAdmin,
cinemaController.createTheatre
)

router.post('/session', [
    body('theatre_id').notEmpty().isInt(),
    body('session_date').notEmpty().custom(isValidDateFormat).withMessage('Session date must be in the "yyyy-MM-dd" format'),
    body('session_time').notEmpty().custom(isValidTimeFormat).withMessage('Session time must be in the hh:mm format'),
    body('movie_id').notEmpty().isInt()
],
isAuth,
isAdmin,
cinemaController.createSession)

router.put('/cinema/:id', [
    body('name').notEmpty().isString().trim().escape(),
    body('country').notEmpty().isString().trim().escape(),
    body('streetAddress').notEmpty().isString().trim().escape(),
    body('designator').optional().isString().trim().escape(),
    body('city').notEmpty().isString().trim().escape(),
    body('state').notEmpty().isString().trim().escape(),
    body('postcode').notEmpty().isInt()
],
isAuth,
isAdmin,
cinemaController.updateCinema
)

router.put('/theatre/:id', [
    body('cinema_id').notEmpty().isInt(),
    body('theatre_number').notEmpty().isInt(),
    body('theatre_type').notEmpty().custom(isValidTheatreType).withMessage('Theatre types must be either Gold Class, Standard, V-Max, Drive-In'),
],
isAuth,
isAdmin,
cinemaController.updateTheatre)

router.delete('/cinema/:id', isAuth, isAdmin, cinemaController.deleteCinema);

router.delete('/theatre/:id', isAuth, isAdmin, cinemaController.deleteTheatre);

module.exports = router;
