import connectDB from "@/config/database";
import Property from "@/models/Property";
import {getSessionUser} from "@/utils/getSessionUser.js"
import cloudinary from "@/config/cloudinary.js";

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
        await connectDB();
 
        // current user logged in ko session id retrieve garna help garcha
        // jun ko logic chai utils/getSessionUser.js ma cha
        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response('UserId is required',{status:401});
        }
        const {userId} = sessionUser;
        
        const formData = await request.formData();
        // console.log(formData.get('name'));

        // Access all values from amenities and images
        const amenities = formData.getAll('amenities');

        // ignore empty or invalid file inputs for images and accept the one in array
        const images = formData.getAll('images').filter((image)=>image.name !== '');

        // console.log(amenities,images);

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

        // upload  multiple images to cloudinary
        const imageUploadPromises = [];

        for(const image of images){
            // reads the image file into a binary buffer
            const imageBuffer = await image.arrayBuffer();

            // turns that into a typed array of bytes
            const imageArray = Array.from(new Uint8Array(imageBuffer));

            // converts it into a Node.js Buffer object (binary data container)
            const imageData = Buffer.from(imageArray);

            // convert the image data to base64
            const imageBase64 = imageData.toString('base64');

            // make request to upload to cloudinary
            const result = await cloudinary.uploader.upload(
                `data:image/png;base64,${imageBase64}`,{
                  folder:'PropertyPlus'
                }
            );

            // result.secure_url is the HTTPS URL returned by Cloudinary for that image.
            imageUploadPromises.push(result.secure_url);

            // wait for all images to upload
            const uploadedImages = await Promise.all(imageUploadPromises);

            // add uploaded images to the propertyData object
            propertyData.images = uploadedImages;
        }

        const newProperty = new Property(propertyData);
        await newProperty.save();


        console.log(propertyData);

        // return new Response(JSON.stringify({message:"Successfull"}),{status:200});

        return Response.redirect(`${process.env.NEXTAUTH_URL}/properties/${newProperty._id}`);
    }catch(error){
        console.error(error);
        return new Response('Failed to add property',{status:500});
    }
};