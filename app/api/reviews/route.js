import connectDB from "@/config/database";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import { getSessionUser } from "@/utils/getSessionUser";
import { isStayCompleted } from "@/utils/reviewEligibility";
import { updatePropertyRating } from "@/utils/updatePropertyRating";
import { reviewSchema } from "@/lib/reviewSchema";

export const dynamic = 'force-dynamic';

// POST /api/reviews
// The gate that makes a review trustworthy: it is written against one specific
// booking, and that booking has to be the author's own and already finished.
// Which property the review lands on and who wrote it are both read off the
// booking rather than taken from the request, so a caller cannot aim a review
// at a property they never stayed at.
export const POST = async (request) => {
    try {
        await connectDB();

        const sessionUser = await getSessionUser();
        if (!sessionUser || !sessionUser.userId) {
            return new Response(JSON.stringify({message:'You must be logged in to leave a review'}),{status:401});
        }
        const {userId} = sessionUser;

        const body = await request.json();

        const parsed = reviewSchema.safeParse(body);
        if(!parsed.success){
            return new Response(
                JSON.stringify({message: parsed.error.issues[0].message}),
                {status:400}
            );
        }
        const {rating,title,body:reviewBody} = parsed.data;

        const booking = await Booking.findById(body.booking);
        if(!booking){
            return new Response(JSON.stringify({message:'Booking not found'}),{status:404});
        }

        // only the guest who stayed can review the stay, never the owner
        if(booking.guest.toString() !== userId){
            return new Response(
                JSON.stringify({message:'You can only review your own stay'}),
                {status:401}
            );
        }

        // a pending, cancelled or still-running stay earns no review
        if(!isStayCompleted(booking)){
            return new Response(
                JSON.stringify({message:'You can only review a stay once it is over'}),
                {status:403}
            );
        }

        // one review per booking, so a repeat guest gets a voice per stay
        // rather than an unlimited one
        const existing = await Review.findOne({booking:booking._id});
        if(existing){
            return new Response(
                JSON.stringify({message:'You have already reviewed this stay'}),
                {status:409}
            );
        }

        const newReview = new Review({
            booking:booking._id,
            property:booking.property,
            author:userId,
            rating,
            title,
            body:reviewBody
        });
        await newReview.save();

        // roll the new score into the property so cards and sorting see it
        await updatePropertyRating(booking.property);

        return new Response(
            JSON.stringify({message:'Thanks for your review',review:newReview}),
            {status:201}
        );
    } catch (error) {
        // the unique index on booking is the last line of defence against two
        // reviews racing in for the same stay
        if(error?.code === 11000){
            return new Response(
                JSON.stringify({message:'You have already reviewed this stay'}),
                {status:409}
            );
        }
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};
