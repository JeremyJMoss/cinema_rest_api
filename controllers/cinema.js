const {validationResult} = require('express-validator');
const Theatre = require('../models/theatre');
const Session = require('../models/session');
const Movie = require('../models/movie');
const SeatStructure = require('../models/seatStructure');

exports.createTheatre = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const {number, type, seats} = req.body;
    
    const theatre = new Theatre(number, type);
    try{
        const alreadyExists = await theatre.checkTheatreNumberExists();
        if (alreadyExists){
            return res.status(422).json({message: "A theatre already exists with that number for this cinema"})
        }
        const newTheatre = await theatre.save();

        await SeatStructure.deleteByTheatre(newTheatre.id);

        for (const row of seats){
            for (const seat of row){
                const newSeat = new SeatStructure(
                    seat.isDisabled ? 'disabled' : 'standard',
                    seat.seat,
                    newTheatre.id,
                    !seat.hasSeat
                )
                await newSeat.save();
            }
        }

        return res.status(201).json({message: "Theatre Created Successfully", theatre: newTheatre})
    }
    catch (error) {
        console.log(error);
        next(error);
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

exports.updateTheatre = async (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const {id} = req.params;

    if (!id) res.status(422).json({message: "query missing id parameter"});

    const {number, type, seats} = req.body;

    try {
        const theatre = await Theatre.selectById(id);
        if (!theatre){
            return res.status(404).json({message: "Could not find theatre!"});
        }
        theatre.type = type;
        theatre.number = number;

        const updatedTheatre = await theatre.save();


        if (updatedTheatre){
            await SeatStructure.deleteByTheatre(updatedTheatre.id);

            for (const row of seats){
                for (const seat of row){
                    const newSeat = new SeatStructure(
                        seat.isDisabled ? 'disabled' : 'standard',
                        seat.seat,
                        updatedTheatre.id,
                        !seat.hasSeat
                    )
                    await newSeat.save();
                }
            }
        }

        return res.status(200).json({message: "Theatre updated successfully!", theatre: updatedTheatre})
    
    } catch (error){
        console.log(error);
        next(error);
    }

}

exports.getTheatre = async (req, res, next) => {
    const {id} = req.params;

    if (!id) return res.status(422).json({message: "Missing id query parameter"});

    try {
        const theatre = await Theatre.selectById(id);

        return res.status(200).json(theatre);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getTheatres = async (req, res, next) => {
    try {
        const theatres = await Theatre.selectAll();

        //for each theatre reduce down the non empty seats to a number of seats that this theatre contains
        for (const theatre of theatres){
            const seats = await SeatStructure.getSeatStructures(theatre.id);
            theatre.seats = seats.reduce((acc, cur) => {
                const nonEmptySeats = cur.filter((seat) => !seat.is_empty);
                return acc + nonEmptySeats.length;
            }, 0);
        }

        return res.status(200).json(theatres);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getSession = async (req, res, next) => {
    const {id} = req.params;

    if (!id) return res.status(422).json({message: "Missing id query parameter"});

    try {
        const session = await Session.selectById(id);

        delete session.datetime;

        return res.status(200).json(session);
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}

exports.getAllSessions = async (req, res, next) => {
    const { with_movies, theatre_id, timeline, movie_id } = req.query;

    let { session_date } = req.query;

    if (session_date){
        session_date = new Date(session_date);
    }

    const sessions = await Session.selectAll(session_date, theatre_id, movie_id, timeline);

    if (!sessions.length > 0) return res.status(200).json(sessions);

    for (const session of sessions){
        try{
            const theatre = await Theatre.selectById(session.theatre_id);
            session.theatre = theatre;

            const seats = await SeatStructure.getSeatStructures(session.theatre_id);
            session.theatre.seats = seats.reduce((acc, cur) => {
                const nonEmptySeats = cur.filter((seat) => !seat.is_empty);
                return acc + nonEmptySeats.length;
            }, 0);

            delete session.theatre_id;

            await session.generateEndTime();
            delete session.datetime;
            if (with_movies){
                const movie_info = await Movie.selectById(session.movie_id);
                if (!movie_info){
                    return res.status(422).json({message: 'One or more sessions selected not related to a movie'});
                }
                session.movie = movie_info;
                delete session.movie_id;
            }
        }
        catch (error) {
            console.log(error);
            return next(error);
        }
    }

    return res.status(200).json(sessions);


}

exports.getSeatStructures = async (req, res, next) => {
    const {theatre_id} = req.query;
    
    const seat_structures = await SeatStructure.getSeatStructures(theatre_id);

    res.status(200).json(seat_structures);
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

exports.deleteSession = async (req, res, next) => {
    const {id} = req.params;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    try {
        const session = await Session.selectById(id);
        if (!session){
            return res.status(404).json({message: "Session with that id does not exist"});
        }
        const is_deleted = await session.delete();

        if (!is_deleted){
            throw new Error('Could not delete session from database');
        }
        return res.status(200).json({message: "Session deleted successfully"});
    }
    catch (error) {
        console.log(error);
        next(error);
    }
}