const dbPool = require('../connections/mysqlConnect');
const {decode} = require('html-entities');

class Cinema {
    constructor(name, designator = null, streetAddress, city, state, postcode, country, id = null){
        this.name = name;
        this.designator = designator;
        this.streetAddress = streetAddress;
        this.city = city;
        this.state = state;
        this.postcode = postcode;
        this.country = country;
        this.address = this._buildAddress();
        this.id = id;
    }

    static async selectAll(){
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try{
                const [cinemas] = await connection.query('SELECT * from cinema;');

                if (!cinemas.length > 0){
                    return null;
                }

                cinemas.forEach(cinema => {
                    cinema.name = decode(cinema.name);
                    cinema.address = decode(cinema.address);
                })
                await connection.commit();
                connection.release();
                return cinemas;
            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error selecting all cinemas:', error);
            throw error;
        }
    }

    static async selectById(id){
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try{
                const [cinema] = await connection.execute('SELECT * from cinema WHERE id = ?', [id]);

                if (!cinema.length > 0){
                    return null;
                }

                const selectedCinema = cinema[0];
                selectedCinema.name = decode(selectedCinema.name);
                selectedCinema.address = decode(selectedCinema.address);
                await connection.commit();
                connection.release();
                return selectedCinema;
            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error selecting cinema by id:', error);
            throw error;
        }
    }

    static async deleteById(id){
        try {
            const connection = await dbPool.getConnection();
            // start a transaction
            await connection.beginTransaction();

            try {
                const [deleted] = await connection.execute('DELETE FROM cinema WHERE id = ?', [id]);
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
            console.error('Error in checking cinema title:', error);
            throw error;
        }
    }

    async checkNameExists(){
        try {
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try {
                const [rows] = await connection.execute('SELECT id, name from cinema WHERE name = ? LIMIT 1', [this.name]);
                
                await connection.commit();
                connection.release();

                if (rows.length > 0){
                    // when updating movie make sure that if id's match that it is ok that the title already exists
                    if (this.id && this.id == rows[0].id){
                        return false;
                    }
                    return true;
                }
                return false;
            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error in checking cinema name:', error);
            throw error;
        }
    }

    async save(){
        try{
            const connection = await dbPool.getConnection();

            // start a transaction
            await connection.beginTransaction();

            try{
                let result;
                if (!this.id){
                    // Insert new cinema
                    const response = await connection.execute('INSERT INTO cinema (name, address) VALUES (?, ?)', [
                        this.name,
                        this.address
                    ]);

                    result = response[0];

                    if (!(result && result.affectedRows > 0)) {
                        throw new Error('Insert into cinema table unsuccessful');
                    }
    
                    this.id = result.insertId;
                }
                else {
                    // Update existing cinema
                    const response = await connection.execute('UPDATE cinema SET name = ?, address = ? WHERE id = ?', [
                        this.name,
                        this.address,
                        this.id
                    ])

                    result = response[0];

                    if (!(result && result.affectedRows > 0)){
                        throw new Error('Update of cinema table unsuccessful');
                    }
                }

                await connection.commit();

                connection.release();

                this.name = decode(this.name);
                this.address = decode(this.address);

                return {
                    name: this.name,
                    address: this.address,
                    id: this.id
                };

            }
            catch(error){
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        }
        catch(error){
            console.error('Error saving cinema:', error);
            throw error;
        }
    }

    _buildAddress(){
        // build out address string to add to database
        let address = '';
        address += this.designator ? `${this.designator}, ` : '';
        address += `${this.streetAddress}, `;
        address += `${this.city}, `;
        address += `${this.state} `;
        address += `${this.country} `;
        address += this.postcode;
    
        return address;
    }
}

module.exports = Cinema;