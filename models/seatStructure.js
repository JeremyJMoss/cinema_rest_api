const dbPool = require('../connections/mysqlConnect');
const groupSeatsByRow = require('../util/groupSeats');

class SeatStructure {
    constructor(type, seat_number, theatre_id, is_empty, id = null){
        this.type = type;
        this.seat_number = seat_number;
        this.theatre_id = theatre_id;
        this.is_empty = is_empty;
        this.id = id;
    }

    static async getSeatStructures(theatre_id){
        try {
            const connection = await dbPool.getConnection();

            const [response] = await connection.execute('SELECT * FROM seat_structure WHERE theatre_id = ?', [theatre_id]);

            connection.release();
            
            if (!response.length > 0) {
                return response;
            }

            const gridSeats = groupSeatsByRow(response);

            return gridSeats;

        }
        catch (error) {

        }
    }

    /**
     * @async
     * @returns {Promise<SeatStructure>}
     */
    async save(){
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                let result;

                if (!this.id){
                    const response = await connection.execute('INSERT INTO seat_structure (seat_type, seat_number, theatre_id, is_empty) VALUES (?, ?, ?, ?)', [
                        this.type,
                        this.seat_number,
                        this.theatre_id,
                        this.is_empty
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Insert into seat table unsuccessful');
                    }

                    this.id = result.insertId;
                }
                else {
                    const response = await connection.execute('UPDATE theatre SET seat_type = ?, seat_number = ?, theatre_id = ?, is_empty = ? WHERE id = ?', [
                        this.type,
                        this.seat_number,
                        this.theatre_id,
                        this.is_empty,
                        this.id
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)){
                        throw new Error('Update of seat table unsuccessful');
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
            console.error('Error saving seat:', error);
            throw error;
        }
    }

    /**
     * 
     * @param {int} theatre_id 
     * @returns {Promise<boolean>}
     */
    static async deleteByTheatre(theatre_id){
        try {
            const connection = await dbPool.getConnection();
            // start a transaction
            await connection.beginTransaction();

            try {
                const [deleted] = await connection.execute('DELETE FROM seat_structure WHERE theatre_id = ?', [theatre_id]);
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
            console.error('Error in deleting seats:', error);
            throw error;
        }
    }
}

module.exports = SeatStructure;