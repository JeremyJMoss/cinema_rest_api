const Movie = require('./movie');
const dbPool = require('../connections/mysqlConnect');

class Session {
    constructor(theatre_id, movie_id, session_start_time, session_start_date, id = null) {
        this.theatre_id = theatre_id,
        this.movie_id = movie_id;
        this.session_start_date = session_start_date;
        this.session_start_time = session_start_time;
        this.datetime = this.#getDateTime();
        this.id = id;
    }

    // create javascript Date object using time and date passed in
    #getDateTime() {
        return `${this.session_start_date} ${this.session_start_time}:00`;
    }

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
                return new Session(row.theatre_id, row.movie_id, time, date, row.id);
            })
            
        }
        catch(error) {
            console.error('Error retrieving movies:', error);
            throw error;
        }
    }

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
                return new Session(row.theatre_id, row.movie_id, time, date, row.id);
            })
        }
        catch(error) {
            console.error('Error retrieving movies:', error);
            throw error;
        }
    }

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

    static getSessionDate(date) {
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();

        return `${year}-${month}-${day}`;
    }

    static getSessionTime(date) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        
        return `${hours}:${minutes}`;
    }

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
}

module.exports = Session;