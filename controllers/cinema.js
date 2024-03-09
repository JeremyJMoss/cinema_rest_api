const {validationResult} = require('express-validator');
const Cinema = require('../models/cinema');
const Theatre = require('../models/theatre');
const Session = require('../models/session');

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
        return res.status(201).json({message: "Created new cinema successfully", cinema: savedCinema})
    }
    catch(err){
        console.log(err);
        next(err);
    }
}

exports.createTheatre = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const {theatre_number, theatre_type, cinema_id} = req.body;
    
    const theatre = new Theatre(theatre_number, theatre_type, cinema_id);
    try{
        const alreadyExists = await theatre.checkTheatreNumberExists();
        if (alreadyExists){
            return res.status(422).json({message: "A theatre already exists with that number for this cinema"})
        }
        const newTheatre = await theatre.save();
        return res.status(201).json({message: "Theatre Created Successfully", theatre: newTheatre})
    }
    catch (error) {
        console.log(error);
        next(err);
    }

}

exports.createSession = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({message: "Invalid Input", errors: errors.array()});
    }

    const {theatre_id, movie_id, session_time, session_date} = req.body;

    const session = new Session(theatre_id, movie_id, session_time, session_date);

    const savedSession = await session.save();

    res.status(201).json({message: 'Saved new session successfully', session: savedSession})
}

exports.updateCinema = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const {id} = req.params;

    const {name, designator, country, city, streetAddress, state, postcode} = req.body;
    
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

exports.updateTheatre = async (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const {id} = req.params;

    if (!id) res.status(422).json({message: "query missing id parameter"});

    const {cinema_id, theatre_number, theatre_type} = req.body;

    try {
        const theatre = await Theatre.selectById(id);
        if (!theatre){
            return res.status(404).json({message: "Could not find theatre!"});
        }
        theatre.type = theatre_type;
        theatre.cinema_id = cinema_id;
        theatre.theatre_number = theatre_number;

        const updatedTheatre = await theatre.save();

        return res.status(200).json({message: "Theatre updated successfully!", theatre: updatedTheatre})
    } catch (error){
        console.log(error);
        next(error);
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

        return res.status(200).json(cinema);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getAllTheatresByCinema = async (req, res, next) => {
    const {cinema_id} = req.params;

    if (!cinema_id) return res.status(422).json({message: "Query missing cinema id parameter"});

    try {
        const theatres = await Theatre.selectAllByCinema(cinema_id);

        return res.status(200).json(theatres);
    }
    catch (error){
        console.log(error);
        next(error);
    }
}

exports.getAllSessionsByTheatre = async (req, res, next) => {
    const {theatre_id, session_date} = req.query;

    if (!theatre_id) return res.status(422).json({message: "No theatre id sent with request"});

    const sessions = await Session.selectByTheatre(theatre_id, session_date);

    if (!sessions.length > 0) return res.status(200).json(sessions);

    for (const session of sessions) {
        try {
            await session.generateEndTime();
            delete session.datetime;
        }
        catch (error) {
            console.log(error);
            next(error);
        }
    }

    return res.status(200).json(sessions);
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

exports.deleteTheatre = async (req, res, next) => {
    const {id} = req.params;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    try {
        const theatre = await Theatre.selectById(id);
        if (!theatre){
            return res.status(404).json({message: "Theatre with that id does not exist"});
        }
        const is_deleted = await theatre.delete();

        if (!is_deleted){
            throw new Error('Could not delete theatre from database');
        }
        return res.status(200).json({message: "Theatre deleted successfully"});
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}