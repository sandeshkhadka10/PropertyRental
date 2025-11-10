import connectDB from "@/config/database";
import Property from "@/models/Property";

// GET /api/properties
export const GET = async (request)=>{
    try{
        await connectDB();

        const properties = await Property.find({});
        return new Response(JSON.stringify(properties),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};

// POST /api/properties
export const POST = async (request)=>{
    try{
        const formData = await request.formData();
        // console.log(formData.get('name'));

        // Access all values from amenities and images
        const amenities = formData.getAll('amenities');

        // ignore empty or invalid file inputs for images and accept the one in array
        const images = formData.getAll('images').filter((image)=>image.name !== '');

        console.log(amenities,images);

        return new Response(JSON.stringify({message:"Successfull"}),{status:200});
    }catch(error){
        return new Response('Failed to add property',{status:500});
    }
};