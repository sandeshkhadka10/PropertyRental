import connectDB from "@/config/database";
import Property from "@/models/Property";
import {publicPropertyQuery} from "@/utils/propertyVisibility.js";
import {withAvailability} from "@/utils/loadPropertyAvailability.js";

// GET /api/properties
export const GET = async (request)=>{
    try{
        await connectDB();

        // a listing that is featured but not approved still stays hidden
        const properties = await Property.find(publicPropertyQuery({
            is_featured:true
        }));

        return new Response(JSON.stringify(await withAvailability(properties)),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};