const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.generateToken = async (email, userId) => {
    return jwt.sign({ 
        email, 
        userId 
    }, process.env.JWT_TOKEN, { expiresIn: '12h' });
}

