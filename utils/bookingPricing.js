// Date + price rules for bookings.
// No database or React import, so the booking form, the API routes and any
// test can all share exactly the same rules.

import {toAmount} from '@/utils/formatCurrency';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// A listing carries a single day rate, so 'daily' is the only unit anything is
// charged in now. The other three are here because a booking snapshots the unit
// it was charged under: stays agreed before the switch still read back as the
// weeks and months they were actually priced as.
export const UNIT_LABELS = {
    daily:'day',
    nightly:'night',
    weekly:'week',
    monthly:'month'
};

// `<input type="date">` gives 'YYYY-MM-DD', which the Date constructor reads as
// UTC midnight. Everything is pinned to UTC midnight so a day never gains or
// loses one because of the visitor's timezone.
export const parseBookingDate = (value) => {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

export const todayUTC = () => parseBookingDate(new Date().toISOString());

// How many days of stay the two dates cover. A guest can arrive during the day
// or at night and leaves by 12:00 the next day, so one calendar step from
// check-in to check-out is one full day of stay.
export const calculateStayDays = (checkIn, checkOut) => {
    const start = parseBookingDate(checkIn);
    const end = parseBookingDate(checkOut);
    if (!start || !end) {
        return 0;
    }
    return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
};

// Format a date for a date input without going through local time.
export const toDateInputValue = (date) => {
    const parsed = parseBookingDate(date);
    return parsed ? parsed.toISOString().slice(0,10) : '';
};

/**
 * Prices a stay: the listing's day rate for every day of it.
 *
 * One day costs the rate once, three days cost it three times - there are no
 * weekly or monthly blocks to fit against a stay any more, so the total is a
 * straight multiplication.
 *
 * Returns null when the property has no usable day rate.
 */
export const calculateBookingPrice = (rates, days) => {
    const rate = toAmount(rates?.daily);
    if (rate === null || rate <= 0 || !Number.isFinite(days) || days <= 0) {
        return null;
    }

    const totalPrice = rate * days;

    return {
        days,
        totalPrice,
        // still a list, because that is the shape a booking snapshots and the
        // booking pages read back. It just never holds more than this one line.
        priceBreakdown:[
            {
                unit:'daily',
                count:days,
                rate,
                subtotal:totalPrice
            }
        ]
    };
};

// '3 days' - how a quote reads back to the guest.
export const describeBreakdown = (priceBreakdown = []) =>
    priceBreakdown
        .map((line) => {
            const label = UNIT_LABELS[line.unit] || line.unit;
            return `${line.count} ${label}${line.count > 1 ? 's' : ''}`;
        })
        .join(' + ');
