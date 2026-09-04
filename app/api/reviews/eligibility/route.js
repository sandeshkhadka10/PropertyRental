import connectDB from "@/config/database";
import Booking from "@/models/Booking";
import Review from "@/models/Review";
import { getSessionUser } from "@/utils/getSessionUser";
import { completedStayQuery } from "@/utils/reviewEligibility";

export const dynamic = 'force-dynamic';

// GET /api/reviews/eligibility?propertyId=...
// Tells the property page whether to offer a review form. It answers with the
// finished stays this guest has not written up yet, so the form can name the
// dates it belongs to when someone has stayed more than once.
// Signed out or never stayed both come back as an empty list rather than an
// error, since "no form" is a perfectly normal answer here.
export const GET = async (request) => {
    try {
        await connectDB();

        const propertyId = request.nextUrl.searchParams.get('propertyId');
        if(!propertyId){
            return new Response(JSON.stringify({message:'Property id is required'}),{status:400});
        }

        const sessionUser = await getSessionUser();
        if (!sessionUser || !sessionUser.userId) {
            return new Response(JSON.stringify({reviewableBookings:[]}),{status:200});
        }
        const {userId} = sessionUser;

        const completedStays = await Booking.find(
            completedStayQuery(userId,{property:propertyId})
        )
            .select('checkIn checkOut days')
            .sort({checkOut:-1});

        if(completedStays.length === 0){
            return new Response(JSON.stringify({reviewableBookings:[]}),{status:200});
        }

        // drop the stays that already carry a review
        const reviewed = await Review.find({
            booking:{$in:completedStays.map((stay) => stay._id)}
        }).select('booking');

        const reviewedIds = new Set(reviewed.map((review) => review.booking.toString()));
        const reviewableBookings = completedStays.filter(
            (stay) => !reviewedIds.has(stay._id.toString())
        );

        return new Response(JSON.stringify({reviewableBookings}),{status:200});
    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};
