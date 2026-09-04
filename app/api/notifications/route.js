import connectDB from '@/config/database';
import Notification from '@/models/Notification';
import {getSessionUser} from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

// how far back the bell reads. Older rows stay in the database but the list
// stops here, since nobody scrolls a year of booking chatter.
const MAX_NOTIFICATIONS = 50;

// GET /api/notifications
// The signed-in user's own notifications, newest first.
export const GET = async () => {
    try{
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'You must be logged in'}),{status:401});
        }
        const {userId} = sessionUser;

        const notifications = await Notification.find({recipient:userId})
            .sort({createdAt:-1})
            .limit(MAX_NOTIFICATIONS)
            .populate('actor','username image')
            .populate('property','name images');

        return new Response(JSON.stringify(notifications),{status:200});
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};

// PUT /api/notifications
// Marks the lot as read, which is what the "Mark all as read" button calls.
export const PUT = async () => {
    try{
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'You must be logged in'}),{status:401});
        }
        const {userId} = sessionUser;

        await Notification.updateMany(
            {recipient:userId,read:false},
            {read:true}
        );

        return new Response(JSON.stringify({message:'All notifications marked as read'}),{status:200});
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};
