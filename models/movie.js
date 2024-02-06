const dbPool = require('../connections/mysqlConnect');

class Movie {
    constructor(title, run_time, summary, release_date, rating, director = null, cover_art_url = null, cast = [], id = null){
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

    async save(){
        try {
            const connection = await dbPool.getConnection();
    
            // Start a transaction
            await connection.beginTransaction();
    
            try {
                let result;
    
                if (!this.id) {
                    // Insert new movie
                    let response = await connection.execute("INSERT INTO movie(title, run_time_mins, summary, release_date, rating, cover_art, director) VALUES(?, ?, ?, ?);", [
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
                    
                    // loop through each actor and save them in the database if they are not already in there

                    for (const actor of this.cast) {
                        if (!actor.id){
                            const isExisting = await actor.checkExistingActor();
                            if (!isExisting){
                                await actor.save();
                            }
                        }
                    }

                    // add actors to their respective movie in junction table

                    values = this.cast.map(val => `(${this.id}, ${val.id})`);

                    response = await connection.execute('INSERT INTO movie_actor(movie_id, actor_id) values ?', [values])

                    result = response[0]; 
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
                }
    
                // Commit the transaction if all queries were successful
                await connection.commit();
    
                connection.release();
    
                if (result && result.affectedRows > 0) {
                    return this;
                }
    
                return null;
            } catch (error) {
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error in saving movie:', error);
            throw error;
        }
    }
}