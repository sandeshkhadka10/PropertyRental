// Conflict detection for bookings.
// The same overlap rule is used by the API (as a Mongo query) and by the
// booking form (as a plain comparison), so the two can never drift apart.

import { parseBookingDate } from '@/utils/bookingPricing';

// A booking blocks its dates while it is waiting on the landlord or already accepted.
export const ACTIVE_BOOKING_STATUSES = ['pending', 'confirmed'];

/**
 * Two stays clash when one starts before the other ends AND ends after the
 * other starts. The comparison is strict on both sides on purpose: one guest
 * checking out on the same morning another checks in is not a clash.
 *
 *   existing:      |-------|
 *   clash:      |-----|            starts before, ends inside
 *   clash:            |-----|      starts inside, ends after
 *   clash:      |-------------|    swallows it whole
 *   no clash:  |--|                ends exactly on check-in
 *   no clash:              |--|    starts exactly on check-out
 */
export const rangesOverlap = (aCheckIn, aCheckOut, bCheckIn, bCheckOut) => {
    const aStart = parseBookingDate(aCheckIn);
    const aEnd = parseBookingDate(aCheckOut);
    const bStart = parseBookingDate(bCheckIn);
    const bEnd = parseBookingDate(bCheckOut);

    if (!aStart || !aEnd || !bStart || !bEnd) {
        return false;
    }

    return aStart < bEnd && aEnd > bStart;
};

// The same rule expressed as a Mongo filter, so the database does the search.
export const overlappingBookingQuery = (
    propertyId,
    checkIn,
    checkOut,
    { excludeBookingId = null, statuses = ACTIVE_BOOKING_STATUSES } = {}
) => {
    const query = {
        property: propertyId,
        status: { $in: statuses },
        checkIn: { $lt: parseBookingDate(checkOut) },
        checkOut: { $gt: parseBookingDate(checkIn) }
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    return query;
};

// True when the requested dates hit any of the ranges the availability endpoint returned.
export const isRangeAvailable = (checkIn, checkOut, bookedRanges = []) =>
    !bookedRanges.some((range) => rangesOverlap(checkIn, checkOut, range.checkIn, range.checkOut));
