const dbPool = require('../connections/mysqlConnect');

class Theatre {
    constructor(number, type, cinema_id, id = null){
        this.number = number;
        this.type = type;
        this.cinema_id = cinema_id;
        this.id = id;
    }

    static async selectById(id){
        try{
            const connection = await dbPool.getConnection();

            const response = await connection.execute('SELECT * FROM theatre WHERE id = ? LIMIT 1', [
                id
            ])

            connection.release();

            const result = response[0];

            if (!result.length > 0){
                return null;
            }

            const selectedTheatre = result[0];

            return new Theatre(
                selectedTheatre.theatre_number,
                selectedTheatre.theatre_type,
                selectedTheatre.cinema_id,
                selectedTheatre.id
            )
        }
        catch (error) {
            console.error('Error checking theatre:', error);
            throw error;
        }
    }

    static async selectAllByCinema(cinema_id){
        try{
            const connection = await dbPool.getConnection();

            const response = await connection.execute('SELECT * FROM theatre WHERE cinema_id = ?', [cinema_id]);

            connection.release();

            const result = response[0];

            return result;
        }
        catch (error){
            console.error('Error retreiving theatres:', error);
            throw error;
        }
    }

    async checkTheatreNumberExists(){
        try{
            const connection = await dbPool.getConnection();

            const response = await connection.execute('SELECT * FROM theatre WHERE theatre_number = ? AND cinema_id = ?', [
                this.number,
                this.cinema_id
            ])

            connection.release();

            const result = response[0];

            if (!result.length > 0){
                return false;
            }

            return true;
        }
        catch (error) {
            console.error('Error checking theatre:', error);
            throw error;
        }
    }

    async save(){
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                let result;

                if (!this.id){
                    const response = await connection.execute('INSERT INTO theatre (theatre_number, theatre_type, cinema_id) VALUES (?, ?, ?)', [
                        this.number,
                        this.type,
                        this.cinema_id
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Insert into theatre table unsuccessful');
                    }

                    this.id = result.insertId;
                }
                else {
                    const response = await connection.execute('UPDATE theatre SET theatre_number = ?, theatre_type = ? WHERE id = ?', [
                        this.number,
                        this.type,
                        this.id
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)){
                        throw new Error('Update of theatre table unsuccessful');
                    }
                }

                await connection.commit();

                connection.release();

                return this;
            }
            catch(error){
                await connection.rollback();
                throw error;
            }
        }
        catch (error){
            console.error('Error saving theatre:', error);
            throw error;
        }
    }

    async delete(){
        try {
            const connection = await dbPool.getConnection();
            // start a transaction
            await connection.beginTransaction();

            try {
                const [deleted] = await connection.execute('DELETE FROM theatre WHERE id = ?', [this.id]);
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
            console.error('Error in deleting theatre:', error);
            throw error;
        }
    }
}

module.exports = Theatre;