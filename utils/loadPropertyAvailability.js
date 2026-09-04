// Stamps `availability` onto listings on their way out of the API, so a card
// can say "Rented until 12 Oct" without every component fetching bookings of
// its own. Kept apart from utils/propertyAvailability.js because this half
// touches the database and must never end up in the browser bundle.

import Booking from '@/models/Booking';
import {todayUTC} from '@/utils/bookingPricing';
import {summarizeBookings} from '@/utils/propertyAvailability';

const toPlain = (property)=>
    property && typeof property.toObject === 'function' ? property.toObject() : property;

/**
 * Takes one property or a list of them and returns plain objects with an
 * `availability` field added. One query covers the whole page of listings.
 */
export const withAvailability = async (properties)=>{
    const isList = Array.isArray(properties);
    const list = (isList ? properties : [properties]).filter(Boolean).map(toPlain);

    const ids = list.map((property)=> property._id).filter(Boolean);

    // A stay that has already ended cannot make anything look occupied, and
    // only accepted bookings count - see summarizeBookings().
    const bookings = ids.length === 0 ? [] : await Booking.find({
        property:{$in:ids},
        status:'confirmed',
        checkOut:{$gt:todayUTC()}
    })
        .select('property checkIn checkOut')
        .sort({checkIn:1})
        .lean();

    const byProperty = new Map();
    bookings.forEach((booking)=>{
        const key = booking.property?.toString();
        if(!key){
            return;
        }
        if(!byProperty.has(key)){
            byProperty.set(key,[]);
        }
        byProperty.get(key).push(booking);
    });

    list.forEach((property)=>{
        property.availability = summarizeBookings(byProperty.get(property._id?.toString()) || []);
    });

    return isList ? list : (list[0] ?? null);
};
