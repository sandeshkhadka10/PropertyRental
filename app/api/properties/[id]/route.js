import connectDB from "@/config/database";
import Property from "@/models/Property";
import { getSessionUser } from '@/utils/getSessionUser';
import { canViewProperty } from '@/utils/propertyVisibility.js';
import { withAvailability } from '@/utils/loadPropertyAvailability';
import { notify } from '@/utils/notifications';

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

        // An approved (or pre-moderation) listing is public, so there is no
        // need to pay for a session lookup on the common path.
        if(property.status && property.status !== 'approved'){
            const sessionUser = await getSessionUser();
            const viewer = sessionUser?.userId ? sessionUser : null;

            // 404 rather than 403 so a hidden listing does not confirm it exists
            if(!canViewProperty(property,viewer)){
                return new Response('Property Not Found',{status:404});
            }
        }

        // carries whether the place is taken right now, which the details page
        // and the booking form both show
        return new Response(JSON.stringify(await withAvailability(property)),{status:200});
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

        const {userId,role} = sessionUser;

        const property = await Property.findById(propertyId);
        if(!property){
            return new Response('Property Not Found',{status:404});
        }

        // verify ownership, admins can take any listing down
        if(property.owner.toString() !== userId && role !== 'admin'){
            return new Response('Unauthorized',{status:401});
        }

        await property.deleteOne();

        // Only says anything when an admin took down someone else's listing -
        // an owner deleting their own gets no row back, since notify() drops
        // a notification whose actor is also its recipient.
        await notify({
            recipient:property.owner,
            actor:userId,
            type:'property_removed',
            title:'Listing removed',
            body:`Your listing "${property.name}" was removed by an administrator.`,
            link:'/profile'
        });

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
        const {userId,role} = sessionUser;

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

        // verify ownership, admins may also fix up a listing
        const isOwner = existingProperty.owner.toString() === userId;
        if(!isOwner && role !== 'admin'){
            return new Response('Unauthorized',{status:401});
        }

        const propertyData = {
            type:formData.get('type'),
            name:formData.get('name'),
            description:formData.get('description'),
            location:JSON.parse(formData.get('location')),
            beds:formData.get('beds'),
            baths:formData.get('baths'),
            square_feet:formData.get('square_feet'),
            amenities,
            rates:JSON.parse(formData.get('rates')),
            seller_info:JSON.parse(formData.get('seller_info')),
            // keep the original owner, otherwise an admin editing a listing
            // would quietly take it over
            owner:existingProperty.owner
        };

        const update = {$set:propertyData};

        // An owner editing their listing changes what was approved, so it goes
        // back through moderation with the old verdict cleared. An admin
        // editing it leaves the status alone.
        if(isOwner){
            update.$set.status = 'pending';
            update.$unset = {
                moderation_note:'',
                moderated_at:'',
                moderated_by:''
            };
        }

        // update property in db
        const updatedProperty = await Property.findByIdAndUpdate(id,update,{new:true});

        return new Response(JSON.stringify(updatedProperty),{status:200});
    }catch(error){
        console.error(error);
        return new Response('Failed to add property',{status:500});
    }
};