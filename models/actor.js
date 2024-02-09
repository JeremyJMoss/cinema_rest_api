const dbPool = require('../connections/mysqlConnect');
const {decode} = require('html-entities');

class Actor {
    constructor(name, priority, id = null){
        this.name = name;
        this.priority = priority;
        this.id = id;
    }

    static async selectAll(){
        try {
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                const [actors] = await connection.query('SELECT * from actor;');

                if (!actors.length > 0){
                    return null;
                }

                actors.forEach(actor => {
                    actor.name = decode(actor.name);
                })
                return actors;
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

    static async selectAllByMovie(movieId){
        try {
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                const [actors] = await connection.execute('SELECT a.id, a.name, ma.priority from actor as a JOIN movie_actor as ma on a.id = ma.actor_id WHERE ma.movie_id = ?', [movieId]);

                if (!actors.length > 0){
                    return null;
                }

                actors.forEach(actor => {
                    actor.name = decode(actor.name);
                })
                return actors;
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

    async checkExistingActor(){
        if (this.id){
            return this;
        }
        try {
            const connection = await dbPool.getConnection();

            const [rows] = await connection.execute('SELECT id FROM actor WHERE name = ? LIMIT 1', [this.name]);

            connection.release();

            if (!rows.length > 0){
                return null;
            }

            this.id = rows[0].id;
            return this;

        }
        catch(err) {
            console.log("Error Retrieving actor from database:", err);
            throw err;
        }
    }

    async save(){
        try{
            if (this.id){
                throw new Error('Cannot save actor already in database');
            }
            const connection = await dbPool.getConnection();
            
            const [results] = await connection.execute('INSERT INTO actor (name) values(?)', [this.name]);

            connection.release();

            if (!(results && results.affectedRows > 0)){
                throw new Error('Insert into actor table unsuccessful');
            }

            this.id = results.insertId;

            return this;
        }
        catch(err) {
            console.log("Error saving actor to the database:", err);
            throw err;
        }
    }


}

module.exports = Actor;