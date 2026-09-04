import connectDB from "@/config/database";
import Review from "@/models/Review";

export const dynamic = 'force-dynamic';

// GET /api/properties/:id/reviews
// Public: anyone looking at a listing can read what past guests said.
export const GET = async (request,{params}) => {
    try {
        await connectDB();

        const {id} = await params;

        const reviews = await Review.find({property:id})
            .sort({createdAt:-1})
            .populate('author','username image')
            .populate('booking','checkIn checkOut days');

        return new Response(JSON.stringify(reviews),{status:200});
    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};
