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

app.use((req, res) => {
    res.status(404).json({message:'404 This is not the page you were looking for'});
});

app.use((error, req, res, next) => {
    res.status(500).json({message: error});
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})