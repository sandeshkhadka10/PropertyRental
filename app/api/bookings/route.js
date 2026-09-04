import connectDB from "@/config/database";
import Booking from "@/models/Booking";
import Property from "@/models/Property";
import {getSessionUser} from "@/utils/getSessionUser";
import {completeDueBookings} from "@/utils/completeDueBookings";
import {bookingSchema} from "@/lib/bookingSchema";
import {calculateBookingPrice, calculateStayDays, parseBookingDate} from "@/utils/bookingPricing";
import {overlappingBookingQuery} from "@/utils/bookingAvailability";
import {notify} from "@/utils/notifications";

export const dynamic = 'force-dynamic';

// POST /api/bookings
// A guest requests a stay. The booking starts as 'pending' until the owner accepts it.
export const POST = async (request) => {
    try{
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'You must be logged in to book'}),{status:401});
        }
        const {userId} = sessionUser;

        // The booking form runs this same schema, but that check is only a
        // convenience for the user - this one is what actually decides.
        const parsed = bookingSchema.safeParse(await request.json());
        if(!parsed.success){
            return new Response(
                JSON.stringify({message: parsed.error.issues[0].message}),
                {status:400}
            );
        }
        const {property:propertyId, checkIn, checkOut, guests, note} = parsed.data;

        const property = await Property.findById(propertyId);
        if(!property){
            return new Response(JSON.stringify({message:'Property not found'}),{status:404});
        }

        // an owner booking their own place would defeat the whole point
        if(property.owner.toString() === userId){
            return new Response(
                JSON.stringify({message:'You cannot book your own property'}),
                {status:400}
            );
        }

        const checkInDate = parseBookingDate(checkIn);
        const checkOutDate = parseBookingDate(checkOut);
        const days = calculateStayDays(checkInDate, checkOutDate);

        // Priced on the server from the listing's own day rate - the total the
        // browser worked out is only ever used to preview the quote.
        const quote = calculateBookingPrice(property.rates, days);
        if(!quote){
            return new Response(
                JSON.stringify({message:'This property has no day rate set, so it cannot be booked yet'}),
                {status:400}
            );
        }

        const clash = await Booking.findOne(
            overlappingBookingQuery(property._id, checkInDate, checkOutDate)
        );
        if(clash){
            return new Response(
                JSON.stringify({message:'Those dates are no longer available. Please pick another range.'}),
                {status:409}
            );
        }

        const newBooking = new Booking({
            property:property._id,
            guest:userId,
            owner:property.owner,
            checkIn:checkInDate,
            checkOut:checkOutDate,
            days:quote.days,
            guests,
            note,
            priceBreakdown:quote.priceBreakdown,
            totalPrice:quote.totalPrice
        });
        await newBooking.save();

        // tell the owner someone is waiting on them. This is a side effect of
        // the booking, so it never blocks the response - see utils/notifications
        await notify({
            recipient:property.owner,
            actor:userId,
            type:'booking_requested',
            title:'New booking request',
            body:`${sessionUser.user?.name || 'A guest'} requested to stay at ${property.name} from ${checkInDate.toDateString()} to ${checkOutDate.toDateString()}.`,
            link:'/bookings',
            property:property._id,
            booking:newBooking._id
        });

        return new Response(
            JSON.stringify({message:'Booking requested',booking:newBooking}),
            {status:201}
        );
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};

// GET /api/bookings
// Returns the current user's own stays and, separately, the requests waiting
// on them as a property owner.
export const GET = async () => {
    try{
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'User Id is required'}),{status:401});
        }
        const {userId} = sessionUser;

        // settle anything belonging to this user whose stay has already run its
        // course, so finished bookings show as completed rather than confirmed
        await completeDueBookings({$or:[{guest:userId},{owner:userId}]});

        const trips = await Booking.find({guest:userId})
            .sort({checkIn:-1})
            .populate('property','name images location')
            .populate('owner','username email');

        const requests = await Booking.find({owner:userId})
            .sort({checkIn:-1})
            .populate('property','name images location')
            .populate('guest','username email image');

        return new Response(JSON.stringify({trips,requests}),{status:200});
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};
