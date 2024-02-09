const dbPool = require('../connections/mysqlConnect');
const {decode} = require('html-entities'); 

class Movie {
    constructor(title, run_time, summary, release_date, rating, director, cover_art_url, cast, id = null){
        this.title = title;
        this.run_time = run_time;
        this.summary = summary;
        this.release_date = release_date;
        this.rating = rating;
        this.director = director;
        this.cover_art_url = cover_art_url;
        this.cast = cast; // Should be an array of actors
        this.id = id;
    }

    static async selectAll(){
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try{
                const [movies] = await connection.query('SELECT * from movie;');

                if (!movies.length > 0){
                    return null;
                }

                movies.forEach(movie => {
                    movie.title = decode(movie.title);
                    const date = new Date(movie.release_date);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-indexed
                    const day = String(date.getDate()).padStart(2, '0');
                    movie.release_date = `${year}-${month}-${day}`;
                    movie.summary = decode(movie.summary);
                    if (movie.director) {
                        movie.director = decode(movie.director);
                    }
                })
                return movies;
            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error selecting all movies:', error);
            throw error;
        }
    }

    static async selectById(id){
        try{
            const connection = await dbPool.getConnection();
            // start a transaction
            await connection.beginTransaction();

            try{
                const [row] = await connection.execute('SELECT * from movie where id = ? LIMIT 1;', [id]);

                if (!row.length > 0){
                    return null;
                }

                const movie = row[0]

                movie.title = decode(movie.title);
                const date = new Date(movie.release_date);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-indexed
                const day = String(date.getDate()).padStart(2, '0');
                movie.release_date = `${year}-${month}-${day}`;
                movie.summary = decode(movie.summary);
                if (movie.director) {
                    movie.director = decode(movie.director);
                }

                return movie;
            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error selecting movie:', error);
            throw error;
        }
    }

    static async selectAllByActor(actor_id) {
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try{
                const [movies] = await connection.query('SELECT m.* from movie as m JOIN movie_actor as ma on m.id = ma.movie_id WHERE ma.actor_id = ?;', [actor_id]);

                if (!movies.length > 0){
                    return null;
                }

                movies.forEach(movie => {
                    movie.title = decode(movie.title);
                    const date = new Date(movie.release_date);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-indexed
                    const day = String(date.getDate()).padStart(2, '0');
                    movie.release_date = `${year}-${month}-${day}`;
                    movie.summary = decode(movie.summary);
                    if (movie.director) {
                        movie.director = decode(movie.director);
                    }
                })
                return movies;
            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error selecting movies by actor:', error);
            throw error;
        }
    }

    static async deleteById(id){
        try {
            const connection = await dbPool.getConnection();
            // start a transaction
            await connection.beginTransaction();

            try {
                const [deleted] = await connection.execute('DELETE FROM movie WHERE id = ?', [id]);
                connection.release();

                if (deleted.affectedRows > 0) return true;
                
                return false;
            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error in checking movie title:', error);
            throw error;
        }
    }

    async checkTitleExists(){
        try {
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                const [rows] = await connection.execute('SELECT id, title from movie WHERE title = ? LIMIT 1', [this.title]);

                connection.release();

                if (rows.length > 0){
                    // when updating movie make sure that if id's match that it is ok that the title already exists
                    if (this.id && this.id == rows[0].id){
                        return false;
                    }
                    return true;
                }
                return false;
            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error in checking movie title:', error);
            throw error;
        }
    }

    async save(){
        try {
            const connection = await dbPool.getConnection();
    
            // Start a transaction
            await connection.beginTransaction();
    
            try {
                let result;
    
                if (!this.id) {
                    // Insert new movie
                    let response = await connection.execute("INSERT INTO movie(title, run_time_mins, summary, release_date, rating, cover_art, director) VALUES(?, ?, ?, ?, ?, ?, ?);", [
                        this.title,
                        this.run_time,
                        this.summary,
                        this.release_date,
                        this.rating,
                        this.cover_art_url,
                        this.director 
                    ]);

                    result = response[0];
    
                    this.id = result.insertId;

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Insert into movie table unsuccessful');
                    }
                } 
                else {
                    // Update existing movie
                    const response = await connection.execute("UPDATE movie SET title = ?, run_time_mins = ?, summary = ?, release_date = ?, rating = ?, cover_art = ?, director = ? WHERE id = ?", [
                        this.title,
                        this.run_time,
                        this.summary,
                        this.release_date,
                        this.rating,
                        this.cover_art_url,
                        this.director,
                        this.id
                    ]);
                    result = response[0];

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Update into movie table unsuccessful');
                    }

                    await connection.execute("DELETE FROM movie_actor WHERE movie_id = ?", [this.id]);
                    
                }

                // loop through each actor and save them in the database if they are not already in there
                if (this.cast.length > 0){
                    for (const actor of this.cast) {
                        if (!actor.id){
                            const isExisting = await actor.checkExistingActor();
                            if (!isExisting){
                                await actor.save();
                            }
                        }
                    }

                    // add actors to their respective movie in junction table

                    const values = this.cast.map(val => `(${this.id}, ${val.priority}, ${val.id})`).join(', ');

                    const response = await connection.query(`INSERT INTO movie_actor(movie_id, priority, actor_id) VALUES ${values}`);

                    result = response[0];
                }

                // Commit the transaction if all queries were successful

                await connection.commit();
    
                connection.release();
    
                if (result && result.affectedRows > 0) {
                    this.title = decode(this.title);
                    this.summary = decode(this.summary);
                    if (this.director) {
                        this.director = decode(this.director);
                    }
                    if (this.cast){
                        this.cast.forEach(actor => {
                            actor.name = decode(actor.name);
                        })
                    }
                    return this;
                }
    
                return null;

            } 
            catch (error) {
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        } 
        catch (error) {
            console.error('Error in saving movie:', error);
            throw error;
        }
    }
}

module.exports = Movie;