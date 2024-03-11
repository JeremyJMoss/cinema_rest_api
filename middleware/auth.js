const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader){
        return res.status(401).json({message: 'User not authenticated'});
    }
    const token = authHeader.split(' ')[1];
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.JWT_TOKEN);
    } catch (err){
        return next(err);
    }
    if (!decodedToken){
        return res.status(401).json({message: 'Not authenticated or token has expired.'});
    }
    req.userId = decodedToken.userId;
    req.isAuth = true;
    next();
}