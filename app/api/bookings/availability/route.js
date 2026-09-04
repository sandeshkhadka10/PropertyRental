import connectDB from '@/config/database';
import Booking from '@/models/Booking';
import { ACTIVE_BOOKING_STATUSES } from '@/utils/bookingAvailability';
import { todayUTC } from '@/utils/bookingPricing';

export const dynamic = 'force-dynamic';

// GET /api/bookings/availability?propertyId=...
// Public on purpose: it returns only the blocked date ranges, never who booked them,
// so the booking form can warn about a clash before anything is submitted.
export const GET = async (request) => {
    try {
        await connectDB();

        const propertyId = request.nextUrl.searchParams.get('propertyId');
        if (!propertyId) {
            return new Response(JSON.stringify({ message: 'Property id is required' }), { status: 400 });
        }

        // Stays that have already ended cannot block anything.
        const bookings = await Booking.find({
            property: propertyId,
            status: { $in: ACTIVE_BOOKING_STATUSES },
            checkOut: { $gte: todayUTC() }
        })
            .select('checkIn checkOut')
            .sort({ checkIn: 1 });

        const bookedRanges = bookings.map((booking) => ({
            checkIn: booking.checkIn,
            checkOut: booking.checkOut
        }));

        return new Response(JSON.stringify({ bookedRanges }), { status: 200 });
    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify({ message: 'Something went wrong' }), { status: 500 });
    }
};
