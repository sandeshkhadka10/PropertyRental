import connectDB from "@/config/database";
import Property from "@/models/Property";
import { getSessionUser } from "@/utils/getSessionUser";
import { publicPropertyQuery } from "@/utils/propertyVisibility";
import { withAvailability } from "@/utils/loadPropertyAvailability";

// GET /api/properties/user/:userId
export const GET = async (request,{params})=>{
    try{
        await connectDB();

        const userId = params?.userId || request.nextUrl.pathname.split('/').pop();
        if(!userId){
            return new Response('User ID is required',{status:400});
        }

        // This route powers both the owner's own "Your Listings" panel and any
        // public view of a landlord, so the owner (and an admin) see every
        // status while everyone else only sees what is approved.
        const sessionUser = await getSessionUser();
        const viewerId = sessionUser?.userId;
        const seesEverything = viewerId === userId || sessionUser?.role === 'admin';

        const query = seesEverything
            ? {owner:userId}
            : publicPropertyQuery({owner:userId});

        const properties = await Property.find(query);
        console.log('[api/properties/user] userId:', userId, 'count:', properties.length, 'pathname:', request.nextUrl.pathname, 'params:', params);
        return new Response(JSON.stringify(await withAvailability(properties)),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};