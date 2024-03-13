const dbPool = require('../connections/mysqlConnect');

class Theatre {
    constructor(number, type, seats, id = null){
        this.number = number;
        this.type = type;
        this.seats = seats;
        this.id = id;
    }

    /**
     * @async
     * @returns {Promise<Theatre[]>}
     */
    static async selectAll(){
        try {
            const connection= await dbPool.getConnection();

            const [rows] = await connection.execute('SELECT * FROM theatre');

            connection.release();

            if (!rows.length > 0) {
                return rows;
            }

            return rows.map((row) => {
                return new Theatre(row.theatre_number, row.theatre_type, row.seats, row.id);
            })
        }
        catch (error) {
            console.error('Error selecting theatres:', error);
            throw error;
        }
    }

    /**
     * @async
     * @param {number} id 
     * @returns {Promise<Theatre|null>}
     */
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
                selectedTheatre.seats,
                selectedTheatre.id
            )
        }
        catch (error) {
            console.error('Error selecting theatre:', error);
            throw error;
        }
    }

    /**
     * @async
     * @returns {Promise<boolean>}
     */
    async checkTheatreNumberExists(){
        try{
            const connection = await dbPool.getConnection();

            const response = await connection.execute('SELECT * FROM theatre WHERE theatre_number = ?', [
                this.number,
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

    /**
     * @async
     * @returns {Promise<Theatre>}
     */
    async save(){
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                let result;

                if (!this.id){
                    const response = await connection.execute('INSERT INTO theatre (theatre_number, theatre_type, seats) VALUES (?, ?, ?)', [
                        this.number,
                        this.type,
                        this.seats
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Insert into theatre table unsuccessful');
                    }

                    this.id = result.insertId;
                }
                else {
                    const response = await connection.execute('UPDATE theatre SET theatre_number = ?, theatre_type = ?, seats = ? WHERE id = ?', [
                        this.number,
                        this.type,
                        this.seats,
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

    /**
     * @async
     * @returns {Promise<boolean>}
     */
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