const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const multer = require('multer');
const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movie');
const cinemaRoutes = require('./routes/cinema');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'images');
    },
    filename: (req, file, callback) => {
        callback(null, new Date().toISOString() + '-' + file.originalname);
    }
})

const fileFilter = (req, file, callback) => {
    if (
        file.mimetype === 'image/png' ||
        file.mimetype === 'image/jpg' ||
        file.mimetype === 'image/jpeg'
    ) {
        callback(null, true);
    }
    else {
        callback(null, false);
    }
}

app.use(cors());
app.use(bodyParser.json())
app.use(multer({storage, fileFilter}).single('cover_art'));

app.use('/images', express.static(path.join(__dirname, 'images')));

app.use(authRoutes);
app.use(movieRoutes);
app.use(cinemaRoutes);

app.use((req, res) => {
    res.status(404).json({message:'404 This is not the page you were looking for'});
});

app.use((error, req, res, next) => {
    const errorObject = {message: error.message};
    if (error.expiredAt){
        errorObject.expiredAt = error.expiredAt;
    }
    res.status(500).json(errorObject);
})

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})