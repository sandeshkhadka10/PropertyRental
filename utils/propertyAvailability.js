// Whether a listing is free right now, worked out from its bookings.
//
// Only accepted (confirmed) stays count. A pending request is just a request:
// showing a listing as taken because someone asked about it would be wrong, and
// the booking form already blocks those dates through the availability endpoint
// (see utils/bookingAvailability.js).
//
// No database or React import here, so the API routes and the cards can share
// exactly the same rules.

import {parseBookingDate, todayUTC} from '@/utils/bookingPricing';

// available -> nobody is in it and nothing is booked ahead
// rented    -> a confirmed stay covers today
// booked    -> free today, but a confirmed stay starts later on
export const AVAILABILITY_STATES = ['available','rented','booked'];

const EMPTY_AVAILABILITY = {
    state:'available',
    checkIn:null,
    checkOut:null
};

const toIsoDate = (value)=>{
    const parsed = parseBookingDate(value);
    return parsed ? parsed.toISOString() : null;
};

/**
 * Reduces a property's confirmed bookings to the one fact a visitor cares
 * about: is it taken, and if so until when.
 *
 * `checkOut` is the morning the guest leaves, so a stay that ends today no
 * longer occupies the place - hence `checkOut > today` rather than `>=`, the
 * same strict comparison rangesOverlap() uses.
 */
export const summarizeBookings = (bookings = [], reference = null)=>{
    const today = reference ? parseBookingDate(reference) : todayUTC();
    if(!today || bookings.length === 0){
        return {...EMPTY_AVAILABILITY};
    }

    const ranges = bookings
        .map((booking)=>({
            checkIn:parseBookingDate(booking.checkIn),
            checkOut:parseBookingDate(booking.checkOut)
        }))
        .filter((range)=> range.checkIn && range.checkOut && range.checkOut > today)
        .sort((a,b)=> a.checkIn - b.checkIn);

    if(ranges.length === 0){
        return {...EMPTY_AVAILABILITY};
    }

    // The list is sorted, so the first range either covers today (occupied now)
    // or starts later (free now, taken from that date).
    const next = ranges[0];

    return {
        state: next.checkIn <= today ? 'rented' : 'booked',
        checkIn: toIsoDate(next.checkIn),
        checkOut: toIsoDate(next.checkOut)
    };
};

// UTC so the date reads the same as the one the booking was made against,
// whatever timezone the visitor is in.
export const formatAvailabilityDate = (value)=>{
    const parsed = parseBookingDate(value);
    if(!parsed){
        return '';
    }
    return parsed.toLocaleDateString('en-GB',{
        day:'numeric',
        month:'short',
        year:'numeric',
        timeZone:'UTC'
    });
};

/**
 * How a state reads on screen. Returns null when the payload carries no
 * availability at all, so a route that has not been taught to attach it shows
 * nothing rather than wrongly claiming the place is free.
 */
export const describeAvailability = (availability)=>{
    const state = availability?.state;

    if(state === 'rented'){
        const until = formatAvailabilityDate(availability.checkOut);
        return {
            state,
            label:'Rented',
            short: until ? `Rented until ${until}` : 'Rented',
            note: until
                ? `This property is currently rented out and free again from ${until}.`
                : 'This property is currently rented out.',
            className:'bg-red-100 text-red-800 border-red-200'
        };
    }

    if(state === 'booked'){
        const from = formatAvailabilityDate(availability.checkIn);
        const until = formatAvailabilityDate(availability.checkOut);
        return {
            state,
            label:'Booked',
            short: from ? `Booked from ${from}` : 'Booked',
            note: from && until
                ? `Free right now, but already booked from ${from} to ${until}.`
                : 'Free right now, but already booked for some upcoming dates.',
            className:'bg-amber-100 text-amber-800 border-amber-200'
        };
    }

    if(state === 'available'){
        return {
            state,
            label:'Available',
            short:'Available now',
            note:'No confirmed bookings, so these dates are open.',
            className:'bg-green-100 text-green-800 border-green-200'
        };
    }

    return null;
};
