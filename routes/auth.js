const express = require('express');
const {body} = require('express-validator');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/auth');
const isAdmin = require('../middleware/admin');
const {isValidRole} = require('../util/validation');

const router = express.Router();

router.get('/users', isAuth, isAdmin, authController.getAllUsers);

router.get('/user/:id', isAuth, authController.getUser);

router.post('/signup', [
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    body('password').isLength({ min: 6 }),
    body('first_name').trim().isLength({ min: 1 }),
    body('last_name').trim().isLength({ min: 1 }),
    body('role').optional().custom(isValidRole)
    ],
    authController.signup
)

router.put('/user/:id', [
    body('email').isEmail().normalizeEmail({ gmail_remove_dots: false }),
    body('password').optional().isLength({ min: 6 }),
    body('first_name').trim().isLength({ min: 1 }),
    body('last_name').trim().isLength({ min: 1 }),
    body('role').optional().custom(isValidRole)
    ],
    isAuth,
    authController.updateUser
)

router.post('/login', authController.login)

router.delete('/user/:id', isAuth, authController.deleteAccount);

module.exports = router;