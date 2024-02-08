const {validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const {generateToken, checkAuth} = require('../util/authUtils');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const { email, password, first_name, last_name, is_admin } = req.body;
    //sanitize inputs
    const sanitizedEmail = email.toLowerCase();
    const sanitizedFirstName = first_name.trim();
    const sanitizedLastName = last_name.trim();

    try {
        const user = await User.findByEmail(sanitizedEmail);
        if (user){
            return res.status(409).json({message: 'User already exists. Please use a different email address.'});
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        // setting is_admin to false if is_admin is false or null
        const newUser = new User(sanitizedEmail, hashedPassword, sanitizedFirstName, sanitizedLastName, (is_admin == true));
        const savedUser = await newUser.save();
        res.status(201).json({
            message: "User Created Successfully",
            user: {
                email: savedUser.email,
                first_name: savedUser.first_name,
                last_name: savedUser.last_name,
                id: savedUser.id
            }
        });
    } 
    catch (err){
        next(err);
    }
}

exports.login = async (req, res, next) => {
    const {email, password} = req.body;

    try {
        const user = await User.findByEmail(email);

        if (!user) {
            return res.status(401).json({message: 'Incorrect email or password.'});
        }

        const isEqual = await bcrypt.compare(password, user.password);
        
        if (!isEqual) {
            return res.status(401).json({message: 'Incorrect email or password.'})
        }

        const token = await generateToken(user.email, user.id);

        res.status(200).json({
            token,
            userId: user.id
        })
    }
    catch (err) {
        next(err);
    }
}

exports.updateUser = async (req, res, next) => {
    if (!checkAuth(req, res)) return;

    const requestingUser = await User.findById(req.userId);

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(422).json({ message: "Invalid Input", errors: errors.array() });

    const { email, password, first_name, last_name, is_admin, id } = req.body;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});
    // check if user is the user that is going to be updated or admin otherwise send error response
    if (requestingUser.id !== id && !requestingUser.is_admin){
        return res.status(401).json({message: "User cannot update this user"});
    }
    //sanitize inputs
    const sanitizedEmail = email.toLowerCase();
    const sanitizedFirstName = first_name.trim();
    const sanitizedLastName = last_name.trim();

    try {
        const user = await User.findById(id);

        if (!user) return res.status(409).json({message: 'No user with that id exists.'});

        const hashedPassword = await bcrypt.hash(password, 10);
        // setting is_admin to false if is_admin is false or null
        const userToUpdate = new User(sanitizedEmail, hashedPassword, sanitizedFirstName, sanitizedLastName, (is_admin == true), id);
        const updatedUser = await userToUpdate.save();

        if (!updatedUser) return res.status(500).json({message: "Error occured whilst updating user"});

        res.status(200).json({
            message: "Updated User Successfully",
            user : {
                email: updatedUser.email,
                first_name: updatedUser.first_name,
                last_name: updatedUser.last_name,
                id: updatedUser.id
            }
        })
    }
    catch(err) {
        next(err);
    }
}

exports.deleteAccount = async (req, res, next) => {
    if (!checkAuth(req, res)) return;
    const {id} = req.body;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    try{
        const wasDeleted = await User.deleteById(id);

        if (wasDeleted) return res.status(200).json({message: `User with id ${id} was deleted successfully`});

        return res.status(404).json({message: `User with id ${id} could not be found`});
    }
    catch(err) {
        next(err);
    }
    
}