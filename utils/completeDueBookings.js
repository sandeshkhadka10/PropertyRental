import Booking from '@/models/Booking';

// A confirmed booking becomes 'completed' once its check-out date has passed.
// There is no scheduler in this app, so instead of a cron job we flip them
// lazily: the bookings list calls this on the way in. It is a single indexed
// updateMany, so it is cheap to run on every request.
export const completeDueBookings = async (filter = {}) => {
    await Booking.updateMany(
        {
            ...filter,
            status:'confirmed',
            checkOut:{$lt: new Date()}
        },
        {$set:{status:'completed'}}
    );
};
