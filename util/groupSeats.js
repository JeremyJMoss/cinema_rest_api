const groupSeatsByRow = (seats) => {
    const groupedSeats = {};

    seats.forEach(seat => {
        const row = seat.seat_number.charAt(0);
        if (!groupedSeats[row]) {
            groupedSeats[row] = [];
        }
        groupedSeats[row].push(seat);
    });

    // Sort seats within each row
    for (let row in groupedSeats) {
        groupedSeats[row].sort((a, b) => {
            const seatNumberA = parseInt(a.seat_number.substring(1));
            const seatNumberB = parseInt(b.seat_number.substring(1));
            return seatNumberA - seatNumberB;
        });
    }

    // Convert object to array of arrays and sort alphabetically
    const gridSeats = Object.entries(groupedSeats)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(entry => entry[1]);

    return gridSeats;
}

module.exports = groupSeatsByRow;