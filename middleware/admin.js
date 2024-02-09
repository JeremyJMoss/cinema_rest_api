const User = require('../models/user');

module.exports = async (req, res, next) => {
    // move on if there is no user token anyway
    if (!req.userId){
        return next();
    }
    const user = await User.findById(req.userId);
    if (user.is_admin){
        return next();
    }
    return res.status(401).json({message: "User is not an admin"});
}