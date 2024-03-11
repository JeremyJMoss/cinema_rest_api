const jwt = require('jsonwebtoken');
require('').config();

exports.generateToken = async (email, userId, role) => {
    
    return jwt.sign({ 
        email, 
        userId,
        role,
    }, process.env.JWT_TOKEN, { expiresIn: '12h' });
}

