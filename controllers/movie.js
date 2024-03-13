const {validationResult} = require('express-validator');
const Movie = require('../models/movie');
const Actor = require('../models/actor');
const Session = require('../models/session');
const {clearImage} = require('../util/clearImage');
const {MOVIESPERPAGE} = require('../constants');

exports.createMovie = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid Input", errors: errors.array() });
    }

    const imageFile = req.file;

    let { title, run_time, summary, release_date, rating, director, cast } = req.body;
    
    if (!imageFile){
        return res.status(422).json({message: "No cover art sent in request"});
    }

    cast = JSON.parse(cast);

    const cover_art = imageFile.path;

    /* check if cast is an array with more than 1 element 
    then turn those elements into objects based on actor class */
    if (cast?.length > 0){
        cast = cast.map((actor, index) => {
            return new Actor(actor.name, index, actor?.id);
        })
    }

    const movie = new Movie(title, run_time, summary, release_date, rating, director || null, cover_art, cast ?? []);

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ message: "Invalid input", errors: errors.array() });
    }

    const updatedImageFile = req.file;

    const {id} = req.params;

    let { title, run_time, summary, release_date, rating, director, cast } = req.body;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    cast = JSON.parse(cast);

    /* check if cast is an array with more than 1 element 
    then turn those elements into objects based on actor class */
    if (cast?.length > 0){
        cast = cast.map((actor, index) => {
            return new Actor(actor.name, index, actor?.id);
        })
    }

    try {
        const movie = await Movie.selectById(id);

        const titleExists = await movie.checkTitleExists();
        if (titleExists){
            return res.status(422).json({message: "A movie with that title already exists"});
        }
        movie.title = title;
        movie.run_time = run_time;
        movie.summary = summary;
        movie.release_date = release_date;
        movie.rating = rating;
        movie.director = director;
        movie.cast = cast;
        if ( updatedImageFile){
            if (movie.cover_art){
                await clearImage(movie.cover_art);
            }
            movie.cover_art = updatedImageFile.path;
        }
        const updatedMovie = await movie.save();
        return res.status(201).json({message: "Updated movie successfully", movie: updatedMovie});
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.getAllCurrentMoviesWithSessions = async (req, res, next) => {
    let page = req.query.page;
    if (page){
        page = +page;
    }
    try {
        let totalMovieCount = null;

        if (page){
            totalMovieCount = await Movie.getTotalMoviesAboveDateCount(new Date());
        }
        
        const allMovies = await Movie.selectAllWithSessionsAboveDate(new Date(), page);
        
        if (!allMovies){
            return res.status(404).json({message: "No movies found for this query"});
        }

        for (let movie of allMovies){
            const cast = await Actor.selectAllByMovie(movie.id);
            if (cast){
                // sorting based on most important actor in movie
                sortedCast = cast.sort((a, b) => a.priority - b.priority);
                movie.cast = sortedCast;
            }
        }
        const returnObj = {
            movies: allMovies
        };

        if (page){
            const totalPages = Math.ceil(totalMovieCount/MOVIESPERPAGE);
            returnObj.totalPages = totalPages;
        };

        return res.status(200).json(returnObj);
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.getAllMovies = async (req, res, next) => {
    let page = req.query.page;
    if (page){
        // convert page to a number
        page = +page;
    }
    try {
        let totalMovieCount = null;
        if (page){
            totalMovieCount = await Movie.getTotalMovieCount();
        }
        const allMovies = await Movie.selectAll(page);
        if (!allMovies){
            return res.status(404).json({message: "No movies found for this query"});
        }

        for (let movie of allMovies){
            const cast = await Actor.selectAllByMovie(movie.id);
            if (cast){
                // sorting based on most important actor in movie
                sortedCast = cast.sort((a, b) => a.priority - b.priority);
                movie.cast = sortedCast;
            }
        }
        const returnObj = {
            movies: allMovies
        };

        if (page){
            const totalPages = Math.ceil(totalMovieCount/MOVIESPERPAGE);
            returnObj.totalPages = totalPages;
        };

        return res.status(200).json(returnObj);
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.getMovie = async (req, res, next) => {
    const id = req.params.id;

    if (!id) return res.status(422).json({message: "Missing id query parameter"});
    
    try{
        const movie = await Movie.selectById(id);

        if (!movie){
            return res.status(404).json({message: "No movie found in database with that id"});
        }

        const cast = await Actor.selectAllByMovie(movie.id);
        if (cast){
            // sorting based on most important actor in movie
            sortedCast = cast.sort((a, b) => a.priority - b.priority);
            movie.cast = sortedCast;
        }

        return res.status(200).json(movie);
    }
    catch(error){
        next(error);
    }
}

exports.deleteMovie = async (req, res, next) => {
    const {id} = req.params;

    if (!id) return res.status(422).json({message: "Query missing id parameter"});

    try {
        const movie = await Movie.selectById(id);
        
        if (!movie){
            return res.status(404).json({message: 'Movie with that id does not exist'})
        }

        const sessions = await Session.selectByMovie(movie.id);

        if (sessions.length > 0){
            for (const session of sessions){
                await session.delete();
            }
        }

        const is_deleted = await Movie.deleteById(id);

        if (!is_deleted){
            throw new Error("Could not delete movie from database");
        }
        return res.status(200).json({message: "Movie Deleted Successfully"})
    }
    catch(error) {
        console.log(error);
        next(error);
    }

}

exports.getAllActors = async (req, res, next) => {
    try{
        const {searchQuery} = req.query;

        const allActors = await Actor.selectAll(searchQuery);
        if (!allActors){
            return res.status(404).json({message: "No actors found"});
        }

        return res.status(200).json(allActors);
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.getActorMovies = async (req, res, next) => {
    const {actorId} = req.params;

    if (!actorId) return res.status(422).json({message: "Missing id query parameter"});

    try {
        const actorMovies = await Movie.selectAllByActor(actorId);

        if (!actorMovies){
            return res.status(404).json({message: "No Movies relating to that actor"});
        }

        for (let movie of actorMovies){
            const cast = await Actor.selectAllByMovie(movie.id);
            if (cast){
                movie.cast = cast;
            }
        }

        return res.status(200).json(actorMovies);
    }
    catch(error) {
        console.log(error);
        next(error);
    }
}

exports.getMoviesBySearchQuery = async (req, res, next) => {
    const {searchQuery} = req.query;
    
    try {
        const allMovies = await Movie.selectAll(null, searchQuery);
        if (!allMovies){
            return res.status(404).json({message: "No movies found!"});
        }

        return res.status(200).json(allMovies);

    }
    catch (error){
        console.log(error);
        next(error);
    }
}