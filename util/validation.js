const {RATINGS, ROLES, THEATRE_TYPE} = require('../constants');

exports.isValidDateFormat = value => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(value);
};

exports.isValidRating = value => {
    return RATINGS.includes(value);
}

exports.isValidRole = value => {
    return ROLES.includes(value);
}

exports.isValidTheatreType = value => {
    return THEATRE_TYPE.includes(value);
}

exports.isValidTimeFormat = timeString => {
    const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
  
    return timeRegex.test(timeString);
}

