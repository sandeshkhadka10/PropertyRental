import connectDB from "@/config/database";
import Property from "@/models/Property";
import {getSessionUser} from "@/utils/getSessionUser.js"
import cloudinary from "@/config/cloudinary.js";

// GET /api/properties
export const GET = async (request)=>{
    try{
        await connectDB();

        // reads the page no from the req query string and if the user doesn't provide ?page=.., then by default it goes to page 1
        const page = request.nextUrl.searchParams.get('page') || 1;

        // reads how many items i.e properties to return per page and if the user does't provide then by default it will be 3
        const pageSize = request.nextUrl.searchParams.get('pageSize') || 3;

        // it calculates how many items to skip before MongoDB starts returning results
        const skip = (page - 1) * pageSize;

        // count all the properties in the database
        const total = await Property.countDocuments({});
        // console.log(total);

        // this line returns only the needed items for the current page
        // .skip(skip)-> ignores the previous pages item
        // .limit(pageSize)-> returns only the number of items per page
        const properties = await Property.find({}).skip(skip).limit(pageSize);

        // After pagination we have return these
        const result = {
            total,
            properties
        };

        return new Response(JSON.stringify(result),{status:200});
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
            location: JSON.parse(formData.get('location')),
            beds:formData.get('beds'),
            baths:formData.get('baths'),
            square_feet:formData.get('square_feet'),
            amenities,
            rates: JSON.parse(formData.get('rates')),
            seller_info: JSON.parse(formData.get('seller_info')),
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