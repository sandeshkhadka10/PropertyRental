import Notification from '@/models/Notification';
import User from '@/models/User';

// Accepts an id, a populated document or a plain string and gives back a
// comparable string, since the routes hand us a mix of all three.
const toId = (value) => {
    if(!value){
        return null;
    }
    return value._id ? value._id.toString() : value.toString();
};

// A notification is a side effect of the thing the user actually asked for, so
// it must never be the reason a booking or a listing fails to save. Everything
// below swallows its own errors and reports them to the log instead.
//
// Self-addressed rows are dropped as well: an owner cancelling their own
// booking does not need telling that they cancelled it.
export const notify = async ({recipient,actor,type,title,body,link,property,booking}) => {
    try{
        const recipientId = toId(recipient);
        if(!recipientId){
            return null;
        }

        if(actor && toId(actor) === recipientId){
            return null;
        }

        return await Notification.create({
            recipient:recipientId,
            actor:toId(actor) || undefined,
            type,
            title,
            body,
            link,
            property:toId(property) || undefined,
            booking:toId(booking) || undefined
        });
    }catch(error){
        console.error('Failed to create notification:',error);
        return null;
    }
};

// Same contract as notify, for the cases that fan out to several people at
// once - the guests displaced by a confirmed booking, or every admin when a
// listing arrives in the moderation queue.
export const notifyMany = async (notifications) => {
    if(!Array.isArray(notifications) || notifications.length === 0){
        return [];
    }

    try{
        const rows = notifications
            .filter((notification)=>{
                const recipientId = toId(notification?.recipient);
                if(!recipientId){
                    return false;
                }
                return !(notification.actor && toId(notification.actor) === recipientId);
            })
            .map((notification)=>({
                recipient:toId(notification.recipient),
                actor:toId(notification.actor) || undefined,
                type:notification.type,
                title:notification.title,
                body:notification.body,
                link:notification.link,
                property:toId(notification.property) || undefined,
                booking:toId(notification.booking) || undefined
            }));

        if(rows.length === 0){
            return [];
        }

        return await Notification.insertMany(rows);
    }catch(error){
        console.error('Failed to create notifications:',error);
        return [];
    }
};

// Used for the moderation queue notice. Returns ids only, and an empty list on
// failure, so the caller can hand it straight to notifyMany.
export const findAdminIds = async () => {
    try{
        const admins = await User.find({role:'admin'}).select('_id');
        return admins.map((admin)=>admin._id);
    }catch(error){
        console.error('Failed to look up admins:',error);
        return [];
    }
};
