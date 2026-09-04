import connectDB from "@/config/database";
import Property from "@/models/Property";
import { requireAdmin } from "@/utils/requireAdmin";
import { notify } from "@/utils/notifications";

const MODERATION_STATUSES = ['pending','approved','rejected','flagged'];

// What the owner is told for each verdict. 'pending' is missing on purpose:
// putting a listing back in the queue is an internal step, not news.
const MODERATION_NOTICES = {
    approved:{
        type:'property_approved',
        title:'Listing approved',
        body:(name)=>`Your listing "${name}" was approved and is now live in search.`
    },
    rejected:{
        type:'property_rejected',
        title:'Listing rejected',
        body:(name)=>`Your listing "${name}" was rejected, so it is not visible to guests.`
    },
    flagged:{
        type:'property_flagged',
        title:'Listing hidden',
        body:(name)=>`Your listing "${name}" was flagged by an administrator and is hidden from search.`
    }
};

// PATCH /api/admin/properties/:id
// Body: { status?, moderation_note?, is_featured? }
// This is the one endpoint behind approve, reject, flag, restore and the
// featured toggle, since they are all the same write.
export const PATCH = async (request,{params})=>{
    try{
        const {error,admin} = await requireAdmin();
        if(error){
            return error;
        }

        await connectDB();

        const {id} = await params;
        const body = await request.json();

        const property = await Property.findById(id);
        if(!property){
            return new Response('Property Not Found',{status:404});
        }

        let changed = false;

        if(body.status !== undefined){
            if(!MODERATION_STATUSES.includes(body.status)){
                return new Response('Invalid status',{status:400});
            }

            property.status = body.status;
            // the note only makes sense on a knock-back, so it is cleared when
            // the listing goes live again
            property.moderation_note =
                (body.status === 'rejected' || body.status === 'flagged')
                    ? (body.moderation_note || '').trim() || undefined
                    : undefined;
            property.moderated_at = new Date();
            property.moderated_by = admin._id;
            changed = true;
        }

        if(body.is_featured !== undefined){
            property.is_featured = Boolean(body.is_featured);
            changed = true;
        }

        if(!changed){
            return new Response('Nothing to update',{status:400});
        }

        await property.save();

        // Tell the owner what the verdict was, and pass on the reason they
        // were given, since a knock-back is not much use without one.
        const notice = MODERATION_NOTICES[body.status];
        if(notice){
            await notify({
                recipient:property.owner,
                actor:admin._id,
                type:notice.type,
                title:notice.title,
                body:property.moderation_note
                    ? `${notice.body(property.name)} Reason: ${property.moderation_note}`
                    : notice.body(property.name),
                link:`/properties/${property._id}`,
                property:property._id
            });
        }

        return new Response(JSON.stringify(property),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};

// DELETE /api/admin/properties/:id
// Removing a listing outright, as opposed to flagging it, which only hides it.
export const DELETE = async (request,{params})=>{
    try{
        const {error,admin} = await requireAdmin();
        if(error){
            return error;
        }

        await connectDB();

        const {id} = await params;

        const property = await Property.findById(id);
        if(!property){
            return new Response('Property Not Found',{status:404});
        }

        await property.deleteOne();

        // no property ref on this one - it has just been deleted
        await notify({
            recipient:property.owner,
            actor:admin._id,
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
