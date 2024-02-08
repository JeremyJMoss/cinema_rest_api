const dbPool = require('../connections/mysqlConnect');

class User{
    constructor(email, password, first_name, last_name, is_admin = false, id = null){
        this.email = email;
        this.password = password;
        this.first_name = first_name;
        this.last_name = last_name;
        this.is_admin = is_admin;
        this.id = id;
    }

    static async findById(id){
        try{
            const connection = await dbPool.getConnection();

            const [rows] = await connection.execute('SELECT * FROM cinema_users WHERE id = ? LIMIT 1', [id]);

            connection.release();

            if (!rows.length > 0){
                return null;    
            }
            
            const user_fields = rows[0]; 

            return new User(user_fields.email, user_fields.password, user_fields.first_name, user_fields.last_name, user_fields.is_admin, user_fields.id);

        } catch (err){
            console.log("Error Retrieving User by Id:", err);
            throw err;
        }
    }

    static async findByEmail(email){
        try {
            const connection = await dbPool.getConnection();

            const [rows] = await connection.execute('SELECT * FROM cinema_users WHERE email = ? LIMIT 1', [email]);

            connection.release();

            if (rows.length == 0){
                return null;    
            }
            
            const user_fields = rows[0]; 

            return new User(user_fields.email, user_fields.password, user_fields.first_name, user_fields.last_name, user_fields.is_admin, user_fields.id);
        }
        catch(err) {
            console.log("Error Retrieving User by Email:", err);
            throw err;
        }
    }

    static async deleteById(id){
        try {
            const connection = await dbPool.getConnection();

            const [result] = await connection.execute('DELETE FROM cinema_users WHERE id = ?', [id]);

            if (result && result.affectedRows > 0){
                return true;
            }
            return false;
        }
        catch(err) {
            console.log("Error Deleting User:", err);
            throw err;
        }
    }

    async save(){
        try {
            const connection = await dbPool.getConnection();
    
            // Start a transaction
            await connection.beginTransaction();
    
            try {
                let result;
    
                if (!this.id) {
                    // Insert new user
                    const response = await connection.execute("INSERT INTO cinema_users(email, password, first_name, last_name, is_admin) VALUES(?, ?, ?, ?, ?);", [
                        this.email,
                        this.password,
                        this.first_name,
                        this.last_name,
                        this.is_admin
                    ]);

                    result = response[0];
    
                    this.id = result.insertId;
                } else {
                    // Update existing user
                    const response = await connection.execute("UPDATE cinema_users SET email = ?, password = ?, first_name = ?, last_name = ?, is_admin = ? WHERE id = ?", [
                        this.email,
                        this.password,
                        this.first_name,
                        this.last_name,
                        this.is_admin,
                        this.id
                    ]);
                    result = response[0];
                }
    
                // Commit the transaction if all queries were successful
                await connection.commit();
    
                connection.release();
    
                console.log(result);
                if (result && result.affectedRows > 0) {
                    return this;
                }
    
                return null;
            } catch (error) {
                // Rollback the transaction if an error occurs
                await connection.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error in saving user:', error);
            throw error;
        }
    }
}

module.exports = User;