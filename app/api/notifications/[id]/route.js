import connectDB from '@/config/database';
import Notification from '@/models/Notification';
import {getSessionUser} from '@/utils/getSessionUser';

export const dynamic = 'force-dynamic';

// PUT /api/notifications/:id
// Toggles read, matching how a message is marked read elsewhere in the app.
export const PUT = async (request,{params}) => {
    try{
        const {id} = await params;
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'You must be logged in'}),{status:401});
        }
        const {userId} = sessionUser;

        const notification = await Notification.findById(id);
        if(!notification){
            return new Response(JSON.stringify({message:'Notification not found'}),{status:404});
        }

        // only the person it was addressed to can touch it
        if(notification.recipient.toString() !== userId){
            return new Response(JSON.stringify({message:'Unauthorized'}),{status:401});
        }

        notification.read = !notification.read;
        await notification.save();

        return new Response(JSON.stringify(notification),{status:200});
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};

// DELETE /api/notifications/:id
export const DELETE = async (request,{params}) => {
    try{
        const {id} = await params;
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'You must be logged in'}),{status:401});
        }
        const {userId} = sessionUser;

        const notification = await Notification.findById(id);
        if(!notification){
            return new Response(JSON.stringify({message:'Notification not found'}),{status:404});
        }

        if(notification.recipient.toString() !== userId){
            return new Response(JSON.stringify({message:'Unauthorized'}),{status:401});
        }

        await notification.deleteOne();

        return new Response(JSON.stringify({message:'Notification deleted',read:notification.read}),{status:200});
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
};
