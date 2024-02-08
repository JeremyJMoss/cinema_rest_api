const express = require('express');
const {body} = require('express-validator');
const authController = require('../controllers/auth');
const isAuth = require('../middleware/auth');

const router = express.Router();

router.post('/signup', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').trim().isLength({ min: 1 }),
    body('last_name').trim().isLength({ min: 1 }),
    body('is_admin').optional().isBoolean()
    ],
    authController.signup
)

router.put('/users', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').trim().isLength({ min: 1 }),
    body('last_name').trim().isLength({ min: 1 }),
    body('is_admin').optional().isBoolean()
    ],
    isAuth,
    authController.updateUser
)

router.post('/login', authController.login)

router.delete('/user', isAuth, authController.deleteAccount);

module.exports = router;