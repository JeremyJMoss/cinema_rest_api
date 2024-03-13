const dbPool = require('../connections/mysqlConnect');
const {decode} = require('html-entities');

class Actor {
    constructor(name, priority, id = null){
        this.name = name;
        this.priority = priority;
        this.id = id;
    }

    /**
     * @async
     * @param {string} [query=null]
     * @returns {Promise<Actor[]>}
     */
    static async selectAll(query = null){
        try {
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            let sql = "SELECT * FROM actor";

            if (query){
                sql += ` WHERE name LIKE ? OR name LIKE ?`;
            }

            try {
                // for search query matching only from first naem start and last name start rather than parts of words
                const [actors] = await connection.execute(sql, query ? [`% ${query}%`, `${query}%`] : []);

                await connection.commit();
                connection.release();
                
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

    /**
     * @async
     * @param {number} movieId 
     * @returns {Promise<Actor[]>}
     */
    static async selectAllByMovie(movieId){
        try {
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                const [actors] = await connection.execute('SELECT a.id, a.name, ma.priority from actor as a JOIN movie_actor as ma on a.id = ma.actor_id WHERE ma.movie_id = ?', [movieId]);

                await connection.commit();
                connection.release();

                if (!actors.length > 0){
                    
                    return actors;
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
            console.error('Error selecting all actors by movie:', error);
            throw error;
        }
    }

    /**
     * @async
     * @returns {Promise<boolean>}
     */
    async checkExistingActor(){
        if (this.id){
            return true;
        }
        try {
            const connection = await dbPool.getConnection();

            const [rows] = await connection.execute('SELECT id FROM actor WHERE name = ? LIMIT 1', [this.name]);

            connection.release();

            if (!rows.length > 0){
                return false;
            }

            this.id = rows[0].id;
            return true;

        }
        catch(err) {
            console.log("Error Retrieving actor from database:", err);
            throw err;
        }
    }

    /**
     * @async
     * @returns {Promise<Actor>}
     */
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