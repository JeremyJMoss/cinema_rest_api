const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.generateToken = async (email, userId) => {
    return jwt.sign({ 
        email, 
        userId 
    }, process.env.JWT_TOKEN, { expiresIn: '12h' });
}

exports.checkAuth = (req, res) => {
    if (!req.isAuth){
        return res.status(401).json({message: 'Not authenticated or token has expired.'});
    }
}

