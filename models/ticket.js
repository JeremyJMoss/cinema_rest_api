const dbPool = require('../connections/mysqlConnect');

class Ticket{
    constructor(concession_type, seat_position, session_id, user_id, id = null){
        this.concession_type = concession_type;
        this.seat_position = seat_position;
        this.session_id = session_id;
        this.user_id = user_id;
        this.id = id;
    }

    /**
     * @async
     * @returns {Promise<Ticket>}
     */
    async save(){
        const connection = await dbPool.getConnection();
    
        // Start a transaction
        await connection.beginTransaction();
        
        try {
            try {
                let result;

                if (!this.id){
                    const response = await connection.execute('INSERT INTO ticket (user_id, concession_type, seat_position, session_id) VALUES (?, ?, ?, ?)', [
                        this.user_id,
                        this.concession_type,
                        this.seat_position,
                        this.session_id
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Insert into ticket table unsuccessful');
                    }

                    this.id = result.insertId;
                }
                else {
                    const response = await connection.execute('UPDATE ticket SET user_id = ?, concession_type = ?, seat_position = ?, session_id = ? WHERE id = ?', [
                        this.user_id,
                        this.concession_type,
                        this.seat_position,
                        this.session_id,
                        this.id
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)){
                        throw new Error('Update of ticket table unsuccessful');
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
        catch (error) {
            console.error('Error in saving ticket:', error);
            throw error;
        }
    }
}

module.exports = Ticket;