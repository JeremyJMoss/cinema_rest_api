const dbPool = require('../connections/mysqlConnect');
const {decode} = require('html-entities');
const Actor = require('./actor');
const {MOVIESPERPAGE} = require('../constants');
const formatDate = require('../util/formatDate');

class Movie {
    constructor(title, run_time, summary, release_date, rating, director, cover_art, cast, id = null){
        this.title = title;
        this.run_time = run_time;
        this.summary = summary;
        this.release_date = release_date;
        this.rating = rating;
        this.director = director;
        this.cover_art = cover_art;
        this.cast = cast; // Should be an array of actors
        this.id = id;
    }

    /**
     * @async
     * @returns {Promise<number>}
     */
    static async getTotalMovieCount() {
        const connection = await dbPool.getConnection()

        try {
            const [rows] = await connection.query('SELECT COUNT(id) as count from movie');

            connection.release();

            return rows[0].count;
        }
        catch(error){
            console.error('Error getting count of total movies:', error);
            throw error;
        }
    }

    /**
     * @async
     * @param {number} [page=null] 
     * @param {string} [titleQuery=null] 
     * @returns {Promise<Movie[]>}
     */
    static async selectAll(page = null, titleQuery = null) {
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            let sql = "SELECT * FROM movie";

            if (titleQuery){
                sql += ` WHERE title LIKE ? OR title LIKE ?`;     
            }

            if (page) {
                const offset = (page -1) * MOVIESPERPAGE;
                 sql += ` LIMIT ${MOVIESPERPAGE} OFFSET ${offset}`;
            }

            try{
                const [movies] = await connection.query(sql, titleQuery ? [`% ${titleQuery}%`, `${titleQuery}%`] : []);

                await connection.commit()
                connection.release();

                if (!movies.length > 0){
                    return movies;
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

    /**
     * @async
     * @param {Date} date 
     * @returns {Promise<number>}
     */
    static async getTotalMoviesAboveDateCount(date) {
        const connection = await dbPool.getConnection()

        try {
            const [rows] = await connection.query(`SELECT COUNT(movie.id) AS count FROM movie JOIN session ON session.movie_id = movie.id WHERE session.session_time >= '${formatDate(date)}'`);

            connection.release();

            return rows[0].count;
        }
        catch(error){
            console.error('Error getting count of total movies:', error);
            throw error;
        }
    }

    /**
     * @async
     * @param {Date} date 
     * @param {number} [page=null] 
     * @returns {Promise<Movie[]|null>}
     */
    static async selectAllWithSessionsAboveDate(date, page = null) {
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            let sql = `SELECT DISTINCT movie.* FROM movie JOIN session ON session.movie_id = movie.id WHERE session.session_time >= '${formatDate(date)}'`;

            if (page) {
                const offset = (page -1) * MOVIESPERPAGE;
                 sql += ` LIMIT ${MOVIESPERPAGE} OFFSET ${offset}`;
            }

            try{
                const [movies] = await connection.query(sql);

                await connection.commit()
                connection.release();

                if (!movies.length > 0){
                    return movies;
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

    /**
     * @async
     * @param {number} id 
     * @param  {...string} columns 
     * @returns {Promise<Movie|null>}
     */
    static async selectById(id, ...columns){
        try{
            const connection = await dbPool.getConnection();
            // start a transaction
            await connection.beginTransaction();

            try{
                let sql = 'SELECT ';

                sql += columns.join(', ')

                if (!columns.length > 0){
                    sql += '* '
                } 

                sql += ' FROM movie WHERE id = ? LIMIT 1';

                const [row] = await connection.execute(sql, [id]);

                await connection.commit();
                connection.release();

                if (!row.length > 0){
                    return null;
                }

                const movie = row[0]

                if (movie.title){
                    movie.title = decode(movie.title);
                }
                if (movie.release_date){
                    const date = new Date(movie.release_date);
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0'); // Adding 1 because months are zero-indexed
                    const day = String(date.getDate()).padStart(2, '0');
                    movie.release_date = `${year}-${month}-${day}`;
                }
                if (movie.summary){
                    movie.summary = decode(movie.summary);
                }
                if (movie.director) {
                    movie.director = decode(movie.director);
                }

                if (columns?.length === 0){ 
                    const cast = await Actor.selectAllByMovie(movie.id);
                    return new Movie(movie.title, movie.run_time, movie.summary, movie.release_date, movie.rating, movie.director, movie.cover_art, cast ?? [], movie.id);
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

    /**
     * @async
     * @param {number} actor_id 
     * @returns {Promise<Movie[]>}
     */
    static async selectAllByActor(actor_id) {
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try{
                const [movies] = await connection.query('SELECT m.* from movie as m JOIN movie_actor as ma on m.id = ma.movie_id WHERE ma.actor_id = ?;', [actor_id]);

                await connection.commit();
                connection.release();

                if (!movies.length > 0){
                    return movies;
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

    /**
     * @async
     * @param {number} id 
     * @returns {Promise<boolean>}
     */
    static async deleteById(id){
        try {
            const connection = await dbPool.getConnection();
            // start a transaction
            await connection.beginTransaction();

            try {
                const [deleted] = await connection.execute('DELETE FROM movie WHERE id = ?', [id]);
                
                await connection.commit();
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

    /**
     * @async
     * @returns {Promise<boolean>}
     */
    async checkTitleExists(){
        try {
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                const [rows] = await connection.execute('SELECT id, title from movie WHERE title = ? LIMIT 1', [this.title]);

                await connection.commit();
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

    /**
     * @async
     * @returns {Promise<Movie>}
     */
    async save(){
        try {
            const connection = await dbPool.getConnection();
    
            // Start a transaction
            await connection.beginTransaction();
    
            try {
                let result;
    
                if (!this.id) {
                    // Insert new movie
                    let response = await connection.execute("INSERT INTO movie(title, run_time, summary, release_date, rating, cover_art, director) VALUES(?, ?, ?, ?, ?, ?, ?);", [
                        this.title,
                        this.run_time,
                        this.summary,
                        this.release_date,
                        this.rating,
                        this.cover_art,
                        this.director 
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Insert into movie table unsuccessful');
                    }
    
                    this.id = result.insertId;
                } 
                else {
                    // Update existing movie
                    const response = await connection.execute("UPDATE movie SET title = ?, run_time = ?, summary = ?, release_date = ?, rating = ?, cover_art = ?, director = ? WHERE id = ?", [
                        this.title,
                        this.run_time,
                        this.summary,
                        this.release_date,
                        this.rating,
                        this.cover_art,
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
                if (this.cast?.length > 0){
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
        
                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Unable to Insert into junction table');
                    }

                    // Commit the transaction if all queries were successful
                    await connection.commit();
                    connection.release();
                    
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
                }
                else {
                    await connection.commit();
                    connection.release();
                }
                return this;
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