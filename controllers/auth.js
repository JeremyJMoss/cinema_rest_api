const {validationResult} = require('express-validator');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const {generateToken} = require('../util/authUtils');

exports.signup = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const { email, password, first_name, last_name, role } = req.body;
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
        const newUser = new User(sanitizedEmail, hashedPassword, sanitizedFirstName, sanitizedLastName, role ?? 'user');
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

        const token = await generateToken(user.email, user.id, user.role);

        res.status(200).json({
            token,
        })
    }
    catch (err) {
        next(err);
    }
}

exports.updateUser = async (req, res, next) => {
    const requestingUser = await User.findById(req.userId);

    const {id} = req.params;

    const errors = validationResult(req);

    if (!errors.isEmpty()) return res.status(422).json({ message: "Invalid Input", errors: errors.array() });

    const { email, password, first_name, last_name, role} = req.body;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});
    // check if user is the user that is going to be updated or admin otherwise send error response
    if (requestingUser.id !== id && !(requestingUser.role === 'admin' || requestingUser.role ==='super admin')){
        return res.status(401).json({message: "User cannot update this user"});
    }
    //sanitize inputs
    const sanitizedEmail = email.toLowerCase();
    const sanitizedFirstName = first_name.trim();
    const sanitizedLastName = last_name.trim();

    try {
        const user = await User.findById(id);

        if (!user) return res.status(409).json({message: 'No user with that id exists.'});

        if (password){
            const hashedPassword = await bcrypt.hash(password, 10);
            user.password = hashedPassword;
        }
        // setting is_admin to false if is_admin is false or null
        user.email = sanitizedEmail
        user.first_name = sanitizedFirstName
        user.last_name = sanitizedLastName

        if (role){
            user.role = role;
        }

        const updatedUser = await user.save();

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
    const {id} = req.params;

    const requestingUser = await User.findById(req.userId);

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    // check if user is the user that is going to be updated or admin otherwise send error response
    if (requestingUser.id === id || !(requestingUser.role === 'admin' || requestingUser.role === 'super admin')){
        return res.status(401).json({message: "Current user cannot delete this user"});
    }

    try{
        const user = await User.findById(id);

        if (!user) return res.status(404).json({message: 'User with specified id was not found'});
        
        if (user.role === 'super admin') return res.status(405).json({message: "Super Admins cannot be deleted this way"});

        const wasDeleted = await User.deleteById(id);

        if (!wasDeleted) return res.status(404).json({message: `User with specified id could not be deleted`});
        
        return res.status(200).json({message: `User with specified id was deleted successfully`});
        
    }
    catch(err) {
        next(err);
    }
    
}

exports.getAllUsers = async (req, res, next) => {
    const users = await User.selectAll();

    if (!users) return res.status(409).json({message: 'No users in database.'});

    return res.status(200).json(users);
}

exports.getUser = async (req, res, next) => {
    const {id} = req.params;

    const requestingUser = await User.findById(req.userId);

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    // check if user is the user that is going to be updated or admin otherwise send error response
    if (requestingUser.id !== id && !(requestingUser.role === 'admin' || requestingUser.role === 'super admin')){
        return res.status(401).json({message: "Current user cannot update this user"});
    }

    const user = await User.findById(id);

    if (!user) return res.status(409).json({message: 'No user with that id exists.'});

    return res.status(200).json({
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role
    })
}