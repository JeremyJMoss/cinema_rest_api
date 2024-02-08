const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movie');
require('dotenv').config()

app.use(cors());
app.use(bodyParser.json())

app.use(authRoutes);
app.use(movieRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    res.status(500).json({message: 'Internal Server Error: ' + error});
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})