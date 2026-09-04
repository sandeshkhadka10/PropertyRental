import connectDB from '@/config/database';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import {getSessionUser} from '@/utils/getSessionUser';
import {ALLOWED_STATUS_TRANSITIONS, statusUpdateSchema} from '@/lib/bookingSchema';
import {overlappingBookingQuery} from '@/utils/bookingAvailability';
import {notify, notifyMany} from '@/utils/notifications';

export const dynamic = 'force-dynamic';

// Works out whether the caller is the guest or the owner on this booking,
// which is what decides everything either of them is allowed to do to it.
const roleOn = (booking, userId) => {
    const ownerId = booking.owner?._id ? booking.owner._id.toString() : booking.owner.toString();
    const guestId = booking.guest?._id ? booking.guest._id.toString() : booking.guest.toString();

    if(ownerId === userId){
        return 'owner';
    }
    if(guestId === userId){
        return 'guest';
    }
    return null;
};

// GET /api/bookings/:id
// Backs the single-booking view.
export const GET = async (request, {params}) => {
    try{
        const {id} = await params;
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'You must be logged in'}),{status:401});
        }
        const {userId} = sessionUser;

        const booking = await Booking.findById(id)
            .populate('property','name images location type rates')
            .populate('owner','username email')
            .populate('guest','username email image');
        if(!booking){
            return new Response(JSON.stringify({message:'Booking not found'}),{status:404});
        }

        // Both sides of the stay can read it, nobody else can.
        if(!roleOn(booking, userId)){
            return new Response(JSON.stringify({message:'Unauthorized'}),{status:401});
        }

        return new Response(JSON.stringify(booking),{status:200});
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};

// PUT /api/bookings/:id
// Moves a booking along its lifecycle: pending -> confirmed -> completed, with
// either side able to cancel while it is still pending or confirmed.
export const PUT = async (request, {params}) => {
    try{
        const {id} = await params;
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'You must be logged in'}),{status:401});
        }
        const {userId} = sessionUser;

        const parsed = statusUpdateSchema.safeParse(await request.json());
        if(!parsed.success){
            return new Response(
                JSON.stringify({message: parsed.error.issues[0].message}),
                {status:400}
            );
        }
        const {status} = parsed.data;

        const booking = await Booking.findById(id);
        if(!booking){
            return new Response(JSON.stringify({message:'Booking not found'}),{status:404});
        }

        const role = roleOn(booking, userId);
        if(!role){
            return new Response(JSON.stringify({message:'Unauthorized'}),{status:401});
        }

        // Anything not on this list is refused, so a cancelled booking can never
        // be quietly revived and a guest can never confirm their own request.
        const allowed = ALLOWED_STATUS_TRANSITIONS[role][booking.status] || [];
        if(!allowed.includes(status)){
            return new Response(
                JSON.stringify({message:`A ${booking.status} booking cannot be marked ${status}`}),
                {status:400}
            );
        }

        // what it was before the write, which is what decides the wording of
        // the notification: a cancelled *pending* request was declined, a
        // cancelled *confirmed* one was called off
        const previousStatus = booking.status;

        // Several guests can hold overlapping *pending* requests on the same
        // dates, so accepting one is the moment that has to be settled: check
        // nothing is already confirmed over it, then release what it displaces.
        if(status === 'confirmed'){
            const confirmedClash = await Booking.findOne(
                overlappingBookingQuery(booking.property, booking.checkIn, booking.checkOut,{
                    excludeBookingId:booking._id,
                    statuses:['confirmed']
                })
            );

            if(confirmedClash){
                return new Response(
                    JSON.stringify({message:'You have already confirmed another booking for these dates'}),
                    {status:409}
                );
            }
        }

        booking.status = status;
        await booking.save();

        // only the name is needed, and only for the notification text
        const property = await Property.findById(booking.property).select('name');
        const propertyName = property?.name || 'the property';
        const stay = `${booking.checkIn.toDateString()} to ${booking.checkOut.toDateString()}`;

        if(status === 'confirmed'){
            // The displaced requests have to be read before they are updated:
            // updateMany hands back a count, not the guests who need telling.
            const displacedQuery = overlappingBookingQuery(
                booking.property, booking.checkIn, booking.checkOut,{
                    excludeBookingId:booking._id,
                    statuses:['pending']
                }
            );
            const displaced = await Booking.find(displacedQuery).select('guest checkIn checkOut');

            await Booking.updateMany(displacedQuery,{status:'cancelled'});

            await notify({
                recipient:booking.guest,
                actor:userId,
                type:'booking_confirmed',
                title:'Booking accepted',
                body:`Your stay at ${propertyName} (${stay}) was accepted by the owner.`,
                link:'/bookings',
                property:booking.property,
                booking:booking._id
            });

            // everyone who wanted the same dates and just lost them
            await notifyMany(displaced.map((other)=>({
                recipient:other.guest,
                actor:userId,
                type:'booking_declined',
                title:'Booking request cancelled',
                body:`Your request for ${propertyName} (${other.checkIn.toDateString()} to ${other.checkOut.toDateString()}) was cancelled because those dates have been booked by someone else.`,
                link:'/bookings',
                property:booking.property,
                booking:other._id
            })));
        }

        if(status === 'cancelled'){
            // whoever pressed cancel already knows, so it goes to the other side
            const cancelledByOwner = role === 'owner';
            const declined = cancelledByOwner && previousStatus === 'pending';

            await notify({
                recipient:cancelledByOwner ? booking.guest : booking.owner,
                actor:userId,
                type:declined ? 'booking_declined' : 'booking_cancelled',
                title:declined ? 'Booking request declined' : 'Booking cancelled',
                body:declined
                    ? `The owner declined your request for ${propertyName} (${stay}).`
                    : `The ${cancelledByOwner ? 'owner' : 'guest'} cancelled the booking for ${propertyName} (${stay}).`,
                link:'/bookings',
                property:booking.property,
                booking:booking._id
            });
        }

        if(status === 'completed'){
            await notify({
                recipient:booking.guest,
                actor:userId,
                type:'booking_completed',
                title:'Stay completed',
                body:`Your stay at ${propertyName} (${stay}) is complete. You can now leave a review.`,
                link:`/properties/${booking.property}`,
                property:booking.property,
                booking:booking._id
            });
        }

        return new Response(JSON.stringify(booking),{status:200});
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};
