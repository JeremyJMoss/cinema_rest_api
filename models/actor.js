const dbPool = require('../connections/mysqlConnect');

class Actor {
    constructor(name, id = null){
        this.name = name;
        this.id = id;
    }

    async checkExistingActor(name){
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

module.exports = User;