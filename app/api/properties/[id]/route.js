import connectDB from "@/config/database";
import Property from "@/models/Property";
import { getSessionUser } from '@/utils/getSessionUser';

// GET /api/properties/:id
export const GET = async(request,{params})=>{
    try{
        await connectDB();

        // console.log("Params received:", params);

        const { id } = await params;
        const property = await Property.findById(id);
        if(!property){
            return new Response('Property Not Found',{status:404});
        }
        return new Response(JSON.stringify(property),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};

// DELETE /api/properties/:id
// here the verified user only can delete so we have to validate with 
// the current logged in user session
export const DELETE = async(request,{params})=>{
    try{
        await connectDB();

        const {id:propertyId} = await params;

        const sessionUser = await getSessionUser();

        // check for session
        if(!sessionUser || !sessionUser.userId){
            return new Response('User ID is required',{status:401});
        }

        const {userId} = sessionUser;
        
        const property = await Property.findById(propertyId);
        if(!property){
            return new Response('Property Not Found',{status:404});
        }

        // verify ownership
        if(property.owner.toString() !== userId){
            return new Response('Unauthorized',{status:401});
        }

        await property.deleteOne();

        return new Response('Property Deleted',{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};

// PUT /api/properties/:id
export const PUT = async (request,{params})=>{
    try{
        await connectDB();
 
        // current user logged in ko session id retrieve garna help garcha
        // jun ko logic chai utils/getSessionUser.js ma cha
        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response('UserId is required',{status:401});
        }

        const {id} = params;
        const {userId} = sessionUser;
        
        const formData = await request.formData();
        // console.log(formData.get('name'));

        // Access all values from amenities and images
        const amenities = formData.getAll('amenities');

        // console.log(amenities);

        // get property to update
        const existingProperty = await Property.findById(id);
        if(!existingProperty){
            return new Response('Property doesnot exist',{status:404});
        }

        // verify ownership
        if(existingProperty.owner.toString() !== userId){
            return new Response('Unauthorized',{status:401});
        }

        const propertyData = {
            type:formData.get('type'),
            name:formData.get('name'),
            description:formData.get('description'),
            location:{
                street:formData.get('location.street'),
                city:formData.get('location.city'),
                state:formData.get('location.state'),
                zipcode:formData.get('location.zipcode'),
            },
            beds:formData.get('beds'),
            baths:formData.get('baths'),
            square_feet:formData.get('square_feet'),
            amenities,
            rates:{
                weekly:formData.get('rates.weekly'),
                monthly:formData.get('rates.monthly'),
                nightly:formData.get('rates.nightly')
            },
            seller_info:{
                name:formData.get('seller_info.name'),
                email:formData.get('seller_info.email'),
                phone:formData.get('seller_info.phone')
            },
            owner:userId
        };

        // update property in db
        const updatedProperty = await Property.findByIdAndUpdate(id,propertyData);

        return new Response(JSON.stringify(updatedProperty),{status:200});
    }catch(error){
        console.error(error);
        return new Response('Failed to add property',{status:500});
    }
};