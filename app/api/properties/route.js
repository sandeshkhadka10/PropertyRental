import connectDB from "@/config/database";
import Property from "@/models/Property";
import {getSessionUser} from "@/utils/getSessionUser.js"
import cloudinary from "@/config/cloudinary.js";
import {publicPropertyQuery} from "@/utils/propertyVisibility.js";
import {withAvailability} from "@/utils/loadPropertyAvailability.js";
import {notify, notifyMany, findAdminIds} from "@/utils/notifications";

// matches the limits the add form enforces in lib/propertySchema.js
const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

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

        // only approved listings are public, and the count has to use the exact
        // same filter as the find below or the page numbers stop matching
        const visibleQuery = publicPropertyQuery();

        // count all the properties in the database
        const total = await Property.countDocuments(visibleQuery);
        // console.log(total);

        // Sorting reads the rating straight off the property, which the review
        // routes keep up to date, so no aggregation is needed here. Ties on the
        // score fall back to the better-reviewed listing, then the newer one,
        // which keeps a lone 5-star review from outranking a solid 4.8 average.
        const sortOptions = {
            newest:{createdAt:-1},
            rating:{rating_avg:-1, rating_count:-1, createdAt:-1}
        };
        const sort = sortOptions[request.nextUrl.searchParams.get('sort')] || sortOptions.newest;

        // this line returns only the needed items for the current page
        // .skip(skip)-> ignores the previous pages item
        // .limit(pageSize)-> returns only the number of items per page
        const properties = await Property.find(visibleQuery).sort(sort).skip(skip).limit(pageSize);

        // After pagination we have return these, with each listing carrying
        // whether it is currently rented or booked ahead
        const result = {
            total,
            properties: await withAvailability(properties)
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
        const {userId,role} = sessionUser;

        // only landlords list properties. A tenant can switch themselves over
        // from their profile page, which is what the add page prompts them to do
        if(role !== 'landlord' && role !== 'admin'){
            return new Response(
                'Only landlord accounts can list a property. Switch your account to landlord from your profile.',
                {status:403}
            );
        }

        const formData = await request.formData();
        // console.log(formData.get('name'));

        // Access all values from amenities and images
        const amenities = formData.getAll('amenities');

        // ignore empty or invalid file inputs for images and accept the one in array
        const images = formData
            .getAll('images')
            .filter((image)=>typeof image === 'object' && image.size > 0 && image.name !== '');

        if(images.length > MAX_IMAGES){
            return new Response(`You can upload at most ${MAX_IMAGES} images`,{status:400});
        }

        // a single oversized photo used to blow up mid-upload and surface as a
        // generic 500, so it is caught up front with a message the form can show
        const oversized = images.find((image)=>image.size > MAX_IMAGE_BYTES);
        if(oversized){
            return new Response(
                `"${oversized.name}" is larger than ${MAX_IMAGE_BYTES / (1024 * 1024)}MB. Please upload a smaller image.`,
                {status:400}
            );
        }

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
            owner:userId,
            // never live straight away, an admin has to approve it first
            status:'pending'
        };

        // Upload the images to cloudinary. They go up together rather than one
        // after another, so four photos take about as long as one.
        const imageUploadPromises = images.map(async (image)=>{
            // read the file straight into a Node Buffer. Going through
            // Array.from(new Uint8Array(...)) built a JS array with one element
            // per byte first, which on a handful of phone photos meant millions
            // of array entries and a request that stalled instead of finishing
            const imageData = Buffer.from(await image.arrayBuffer());

            // convert the image data to base64. The mime type comes from the
            // file itself, since hardcoding image/png mislabels jpeg uploads
            const mimeType = image.type || 'image/jpeg';
            const imageBase64 = imageData.toString('base64');

            // make request to upload to cloudinary
            const result = await cloudinary.uploader.upload(
                `data:${mimeType};base64,${imageBase64}`,{
                  folder:'PropertyPlus'
                }
            );

            // result.secure_url is the HTTPS URL returned by Cloudinary for that image.
            return result.secure_url;
        });

        // wait for all images to upload, then add them to the propertyData object
        propertyData.images = await Promise.all(imageUploadPromises);

        const newProperty = new Property(propertyData);
        await newProperty.save();

        // Confirm the listing landed. No actor here: this one is addressed to
        // the person who just did it, and notify() drops self-addressed rows.
        await notify({
            recipient:userId,
            type:'property_submitted',
            title:'Listing submitted',
            body:`"${newProperty.name}" was added and is waiting for an admin to approve it. It stays hidden from search until then.`,
            link:`/properties/${newProperty._id}`,
            property:newProperty._id
        });

        // and put it in front of whoever has to moderate it
        const adminIds = await findAdminIds();
        await notifyMany(adminIds.map((adminId)=>({
            recipient:adminId,
            actor:userId,
            type:'property_pending_review',
            title:'New listing awaiting review',
            body:`"${newProperty.name}" was submitted and needs moderating.`,
            link:'/admin/properties',
            property:newProperty._id
        })));

        // the form submits with fetch, so it wants the new id back rather than a
        // redirect that would make the browser download the whole listing page
        return new Response(JSON.stringify({_id:newProperty._id}),{status:201});
    }catch(error){
        console.error(error);
        return new Response('Failed to add property',{status:500});
    }
};