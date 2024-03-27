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

exports.validateArrayOfArrays = (value) => {
    if (!Array.isArray(value)) {
      throw new Error('Input must be an array');
    }
    value.forEach((innerArray) => {
      if (!Array.isArray(innerArray)) {
        throw new Error('Each element of the array must be an array');
      }
      innerArray.forEach((item) => {
        if (typeof item !== 'object' || !item.seat || typeof item.hasSeat !== 'boolean' || typeof item.isDisabled !== 'boolean') {
          throw new Error('Each inner array must contain objects with properties: seat, hasSeat, isDisabled');
        }
      });
    });
    return true;
  };