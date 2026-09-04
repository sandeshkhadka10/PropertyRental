import connectDB from "@/config/database";
import User from "@/models/User";
import { getSessionUser } from "@/utils/getSessionUser";

// Self service only ever moves between these two. Becoming an admin goes
// through another admin or the ADMIN_EMAILS environment variable.
const SELF_SERVICE_ROLES = ['tenant','landlord'];

// GET /api/users/me
export const GET = async ()=>{
    try{
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response('Unauthorized',{status:401});
        }

        const user = await User
            .findById(sessionUser.userId)
            .select('username email image role');

        if(!user){
            return new Response('User Not Found',{status:404});
        }

        return new Response(JSON.stringify({
            _id:user._id,
            username:user.username,
            email:user.email,
            image:user.image,
            role:user.role || 'tenant'
        }),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};

// PATCH /api/users/me
// Body: { role }
// Lets a tenant turn their own account into a landlord so they can list a
// property, and back again.
export const PATCH = async (request)=>{
    try{
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response('Unauthorized',{status:401});
        }

        const {role} = await request.json();

        if(!SELF_SERVICE_ROLES.includes(role)){
            return new Response('You can only switch between tenant and landlord',{status:400});
        }

        const user = await User.findById(sessionUser.userId);
        if(!user){
            return new Response('User Not Found',{status:404});
        }

        // an admin switching themselves down here would silently lose the panel
        if(user.role === 'admin'){
            return new Response('Admin accounts cannot change their own role',{status:400});
        }

        user.role = role;
        await user.save();

        return new Response(JSON.stringify({role:user.role}),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};
