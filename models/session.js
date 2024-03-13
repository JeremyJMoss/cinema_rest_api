const Movie = require('./movie');
const dbPool = require('../connections/mysqlConnect');
const formatDate = require('../util/formatDate');

class Session {
    constructor(theatre_id, movie_id, session_start_time, session_start_date, id = null) {
        this.theatre_id = theatre_id,
        this.movie_id = movie_id;
        this.session_start_date = session_start_date;
        this.session_start_time = session_start_time;
        this.datetime = this.#getDateTime();
        this.seats_sold = 0;
        this.id = id;
    }

    // create javascript Date object using time and date passed in
    /**
     * 
     * @returns {string}
     */
    #getDateTime() {
        return `${this.session_start_date} ${this.session_start_time}:00`;
    }

    /**
     * @async
     * @param {Date} date 
     * @param {number} theatre_id 
     * @param {string} era // should be either 'past', 'present', or 'future' 
     * @returns {Promise<Session[]>}
     */
    static async selectAll(date = null, theatre_id = null, era = null) {
        try {
            let sql = 'SELECT * FROM session';
            let parameters = [];

            if (!date && era){
                date = new Date();
            }

            if (date) {
                let comparator;
                switch(era){
                    case "past":
                        comparator = "<";
                        break;
                    case "future":
                        comparator = ">";
                        break;
                    default:
                        comparator = "=";
                }
                sql += ` WHERE ${comparator === "=" ? 'DATE(' : ''}session_time${comparator === "=" ? ')' : ''} ${comparator} ${comparator === "=" ? 'DATE(' : ''}?${comparator === "=" ? ')' : ''}`
                parameters.push(formatDate(date));
            }

            if (theatre_id) {
                sql+= ' AND theatre_id = ?';
                parameters.push(theatre_id);
            }

            const connection = await dbPool.getConnection();

            const [rows] = await connection.execute(sql, parameters);

            connection.release();

            if (!rows.length > 0) {
                return rows;
            }

            return rows.map((row) => {
                const date = Session.getSessionDate(row.session_time);
                const time = Session.getSessionTime(row.session_time);
                const session = new Session(row.theatre_id, row.movie_id, time, date, row.id);
                session.seats_sold = row.seats_sold;
                return session;
            })
        }
        catch (error) {
            console.error('Error retrieving movies:', error);
            throw error;
        }
    }

    /**
     * @async
     * @param {number} id 
     * @returns {Promise<Session>}
     */
    static async selectById(id){
        try {
            const connection = await dbPool.getConnection();

            const [rows] = await connection.execute('SELECT * FROM session WHERE id = ? LIMIT 1', [id]);

            connection.release();

            if (!rows.length > 0) {
                return null;
            }

            const session_row = rows[0];

            const date = Session.getSessionDate(session_row.session_time);
            const time = Session.getSessionTime(session_row.session_time);
            
            const session = new Session(session_row.theatre_id, session_row.movie_id, time, date, session_row.id);

            session.seats_sold = session_row.seats_sold;
            return session;

        }
        catch (error) {
            console.error('Error retrieving movie:', error);
            throw error;
        }
    }

    /**
     * @async
     * @param {number} theatre_id 
     * @param {Date} session_date 
     * @returns {Promise<Session[]>}
     */
    static async selectByTheatre(theatre_id, session_date) {
        try {
            let sql = 'SELECT * FROM session WHERE theatre_id = ?'
            const parameters = [theatre_id];

            if (session_date) {
                sql += ' AND DATE(session_time) = ?'
                parameters.push(session_date);
            }

            const connection = await dbPool.getConnection();

            const [rows] = await connection.execute(sql, parameters);

            connection.release();

            if (!rows.length > 0) {
                return rows;
            }

            return rows.map((row) => {
                const date = Session.getSessionDate(row.session_time);
                const time = Session.getSessionTime(row.session_time);
                const session = Session(row.theatre_id, row.movie_id, time, date, row.id);
                session.seats_sold = row.seats_sold;
                return session;
            })
            
        }
        catch(error) {
            console.error('Error retrieving movies:', error);
            throw error;
        }
    }

    /**
     * @async
     * @param {number} movie_id 
     * @returns {Promise<Session[]>}
     */
    static async selectByMovie(movie_id){
        try {
            const connection = await dbPool.getConnection();

            const [rows] = await connection.execute('SELECT * FROM session WHERE movie_id = ?', [movie_id]);

            connection.release();

            if (!rows.length > 0) {
                return rows;
            }

            return rows.map((row) => {
                const date = Session.getSessionDate(row.session_time);
                const time = Session.getSessionTime(row.session_time);
                const session = Session(row.theatre_id, row.movie_id, time, date, row.id);
                session.seats_sold = row.seats_sold;
                return session;
            })
        }
        catch(error) {
            console.error('Error retrieving movies:', error);
            throw error;
        }
    }

    /**
     * Sets session date and session time on instance based on movie run time
     * 
     * @async
     * @returns {null}
     */
    async generateEndTime() {
        const movie = await Movie.selectById(this.movie_id, 'run_time')
        const run_time_mins = movie.run_time % 60;
        const run_time_hours = Math.floor(movie.run_time / 60);

        const [year, month, day] = this.session_start_date.split('-');
        const [hours, minutes] = this.session_start_time.split(':');

        let end_time_mins = (+minutes + run_time_mins + 15) % 60;
        let end_time_hours =  Math.floor((+minutes + run_time_mins) / 60);

        if (end_time_mins > 30){
            end_time_hours++;
            end_time_mins = 0;
        }
        else if(end_time_mins !== 0){
            end_time_mins = 30;
        }

        end_time_hours += run_time_hours;

        const date = new Date(year, month - 1, day, hours, minutes);

        date.setHours(date.getHours() + end_time_hours);

        date.setMinutes(date.getMinutes() + end_time_mins);

        this.session_end_date = Session.getSessionDate(date);

        this.session_end_time = Session.getSessionTime(date);
    }

    /**
     * 
     * @param {Date} date 
     * @returns {string}
     */
    static getSessionDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${year}-${month}-${day}`;
    }

    /**
     * 
     * @param {Date} date 
     * @returns {string}
     */
    static getSessionTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }

    /**
     * @async
     * @returns {Promise<Session>}
     */
    async save() {
        try {
            const connection = await dbPool.getConnection();
            // start a transaction
            await connection.beginTransaction();

            try {
                let result;

                if (!this.id){
                    const response = await connection.execute('INSERT INTO session (theatre_id, movie_id, session_time) VALUES (?, ?, ?)', [
                        this.theatre_id,
                        this.movie_id,
                        this.datetime
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Insert into session table unsuccessful');
                    }

                    this.id = result.insertId;
                }
                else {
                    const response = await connection.execute('UPDATE session SET movie_id = ?, theatre_id = ?, session_time = ? WHERE id = ?', [
                        this.movie_id,
                        this.theatre_id,
                        this.datetime,
                        this.id
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)){
                        throw new Error('Update of session table unsuccessful');
                    }
                }

                await connection.commit();

                connection.release();

                return this;
            }
            catch (error) {
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch (error) {
            console.error('Error saving session:', error);
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
                const [deleted] = await connection.execute('DELETE FROM session WHERE id = ?', [this.id]);
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
            console.error('Error in deleting session:', error);
            throw error;
        }
    }
}

module.exports = Session;