const express = require('express');
const {body} = require('express-validator');
const isAuth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const cinemaController = require('../controllers/cinema');

const router = express.Router();

router.get('/cinemas', cinemaController.getAllCinemas);

router.get('/cinema/:id', cinemaController.getCinema);

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

router.put('/cinema', [
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

router.delete('/cinema/:id', isAuth, isAdmin, cinemaController.deleteCinema);

module.exports = router;
