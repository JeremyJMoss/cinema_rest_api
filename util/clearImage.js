const path = require('path');
const fs = require('fs').promises;

const clearImage = async (filePath) => {
    filePath = path.join(__dirname, '..', filePath);
    try{
        await fs.unlink(filePath);
    }
    catch(err) {
        throw new Error('Failed to delete image on server');
    }
}

exports.clearImage = clearImage;