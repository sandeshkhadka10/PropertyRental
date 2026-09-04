import connectDB from '@/config/database';
import Notification from '@/models/Notification';
import {getSessionUser} from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

// GET /api/notifications/unread-count
// Backs the badge on the navbar bell.
export const GET = async () => {
    try{
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response('You must be logged in',{status:401});
        }
        const {userId} = sessionUser;

        const count = await Notification.countDocuments({
            recipient:userId,
            read:false
        });

        return new Response(JSON.stringify(count),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};
