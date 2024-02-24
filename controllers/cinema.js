const {validationResult} = require('express-validator');
const Cinema = require('../models/cinema');

exports.createCinema = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const {name, designator, country, city, streetAddress, state, postcode} = req.body;
    
    const cinema = new Cinema(name, designator, streetAddress, city, state, postcode, country);
    
    
    try{
        const nameExists = await cinema.checkNameExists();
        if (nameExists){
            return res.status(422).json({message: "A cinema with that name already exists"});
        }
        const savedCinema = await cinema.save();
        console.log(savedCinema);
        return res.status(201).json({message: "Created new cinema successfully", cinema: savedCinema})
    }
    catch(err){
        console.log(err);
        next(err);
    }
}

exports.updateCinema = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const {name, designator, country, city, streetAddress, state, postcode, id} = req.body;
    
    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    const cinema = new Cinema(name, designator, streetAddress, city, state, postcode, country, id);
    
    try{
        const nameExists = await cinema.checkNameExists();
        if (nameExists){
            return res.status(422).json({message: "A cinema with that name already exists"});
        }
        const updatedCinema = await cinema.save();
        if (!updatedCinema) throw new Error("Error occured whilst updating cinema");

        res.status(200).json({message: "Updated cinema successfully", cinema: updatedCinema});
    }
    catch (err) {
        console.log(err);
        next(err);
    }
}

exports.getAllCinemas = async (req, res, next) => {
    try{
        const allCinemas = await Cinema.selectAll();
        if (!allCinemas){
            return res.status(404).json({message: "No cinemas found in database"});
        }

        return res.status(200).json(allCinemas);
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.getCinema = async (req, res, next) => {
    const {id} = req.params;
    
    if (!id) return res.status(422).json({message: "Missing id query parameter"});

    try {
        const cinema = await Cinema.selectById(id);

        if (!cinema){
            return res.status(404).json({message: "No cinema found in database with that id"});
        }

        return res.status(200).json({cinema});
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

exports.deleteCinema = async (req, res, next) => {
    const {id} = req.params;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    try {
        const cinema = await Cinema.selectById(id);
        if (!cinema){
            return res.status(404).json({message: 'Cinema with that id does not exist'})
        }
        const is_deleted = await Cinema.deleteById(id);

        if (!is_deleted){
            throw new Error("Could not delete cinema from database");
        }
        return res.status(200).json({message: "Cinema Deleted Successfully"})
    }
    catch(error) {
        console.log(error);
        next(error);
    }

}