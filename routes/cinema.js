const express = require('express');
const {body} = require('express-validator');
const isAuth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const cinemaController = require('../controllers/cinema');
const { isValidTheatreType, isValidDateFormat, isValidTimeFormat, validateArrayOfArrays } = require('../util/validation');

const router = express.Router();

router.get('/theatres', cinemaController.getTheatres);

router.get('/theatre/:id', cinemaController.getTheatre);

router.get('/session/:id', cinemaController.getSession);

router.get('/sessions', cinemaController.getAllSessions);

router.get('/seat-structures', cinemaController.getSeatStructures);

router.post('/theatre', [
    body('number').notEmpty().isInt(),
    body('type').notEmpty().custom(isValidTheatreType).withMessage('Theatre types must be either Gold Class, Standard, V-Max, Drive-In'),
    body('seats').custom(validateArrayOfArrays)
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

router.put('/theatre/:id', [
    body('number').notEmpty().isInt(),
    body('type').notEmpty().custom(isValidTheatreType).withMessage('Theatre types must be either Gold Class, Standard, V-Max, Drive-In'),
],
isAuth,
isAdmin,
cinemaController.updateTheatre)

router.delete('/theatre/:id', isAuth, isAdmin, cinemaController.deleteTheatre);

router.delete('/session/:id', isAuth, isAdmin, cinemaController.deleteSession);

module.exports = router;
