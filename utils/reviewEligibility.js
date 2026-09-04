// What makes a stay reviewable.
//
// A stay counts as finished in either of two ways:
//   - it is stored as 'completed', which is what completeDueBookings() writes
//     once a confirmed stay's check-out date has passed, or
//   - it is still marked 'confirmed' but the guest has already checked out,
//     because nothing has swept it yet.
//
// Accepting both means a guest is never told to come back later just because
// no request happened to run the sweep since their stay ended.
//
// The rule lives here in both forms - a Mongo filter and a plain predicate - so
// the listing query and the single-booking check can never disagree.

export const COMPLETED_STATUS = 'completed';
export const CONFIRMED_STATUS = 'confirmed';

// Bookings this guest may review: their stay happened, and it is over.
export const completedStayQuery = (guestId, extra = {}) => ({
    guest: guestId,
    $or: [
        { status: COMPLETED_STATUS },
        { status: CONFIRMED_STATUS, checkOut: { $lt: new Date() } }
    ],
    ...extra
});

export const isStayCompleted = (booking) => {
    if (!booking) {
        return false;
    }
    if (booking.status === COMPLETED_STATUS) {
        return true;
    }
    return (
        booking.status === CONFIRMED_STATUS &&
        new Date(booking.checkOut) < new Date()
    );
};
