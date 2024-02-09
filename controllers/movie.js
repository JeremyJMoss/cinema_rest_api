const {validationResult} = require('express-validator');
const {checkAuth} = require('../util/authUtils');
const Movie = require('../models/movie');
const Actor = require('../models/actor');

exports.createMovie = async (req, res, next) => {
    if (!checkAuth(req, res)) return;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    let { title, run_time, summary, release_date, rating, director, cover_art_url, cast } = req.body;

    /* check if cast is an array with more than 1 element 
    then turn those elements into objects based on actor class */
    if (cast && cast.length > 0){
        cast = cast.map((actor, index) => {
            return new Actor(actor.name, index, actor?.id);
        })
    }

    const movie = new Movie(title, run_time, summary, release_date, rating, director || null, cover_art_url || null, cast ?? []);

    try {
        const titleExists = await movie.checkTitleExists();
        if (titleExists){
            return res.status(422).json({message: "A movie with that title already exists"});
        }
        const savedMovie = await movie.save();
        return res.status(201).json({message: "New movie added successfully", movie: savedMovie});
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.updateMovie = async (req, res, next) => {
    if (!checkAuth(req, res)) return;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid input", errors: errors.array() });
    }

    let { id, title, run_time, summary, release_date, rating, director, cover_art_url, cast } = req.body;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    /* check if cast is an array with more than 1 element 
    then turn those elements into objects based on actor class */
    if (cast && cast.length > 0){
        cast = cast.map((actor, index) => {
            return new Actor(actor.name, index, actor?.id);
        })
    }

    const movie = new Movie(title, run_time, summary, release_date, rating, director || null, cover_art_url || null, cast ?? [], id);

    try {
        const titleExists = await movie.checkTitleExists();
        if (titleExists){
            return res.status(422).json({message: "A movie with that title already exists"});
        }
        const updatedMovie = await movie.save();
        return res.status(201).json({message: "Updated movie successfully", movie: updatedMovie});
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.getAllMovies = async (req, res, next) => {
    try{
        const allMovies = await Movie.selectAll();
        if (!allMovies){
            return res.status(404).json({message: "No movies found in database"});
        }

        for (let movie of allMovies){
            const cast = await Actor.selectAllByMovie(movie.id);
            if (cast){
                movie.cast = cast;
            }
        }

        return res.status(200).json(allMovies);
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.getAllActors = async (req,res,next) => {
    try{
        const allActors = await Actor.selectAll();
        if (!allActors){
            return res.status(404).json({message: "No actors found in database"});
        }

        return res.status(200).json(allActors);
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}