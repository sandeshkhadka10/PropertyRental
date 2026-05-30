import connectDB from "@/config/database";
import Property from "@/models/Property";

// GET /api/properties/user/:userId
export const GET = async (request,{params})=>{
    try{
        await connectDB();

        const userId = params?.userId || request.nextUrl.pathname.split('/').pop();
        if(!userId){
            return new Response('User ID is required',{status:400});
        }

        const properties = await Property.find({owner:userId});
        console.log('[api/properties/user] userId:', userId, 'count:', properties.length, 'pathname:', request.nextUrl.pathname, 'params:', params);
        return new Response(JSON.stringify(properties),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};