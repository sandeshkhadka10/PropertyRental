import connectDB from "@/config/database";
import User from "@/models/User";
import { requireAdmin } from "@/utils/requireAdmin";

const ROLES = ['tenant','landlord','admin'];

// PATCH /api/admin/users/:id
// Body: { role }
export const PATCH = async (request,{params})=>{
    try{
        const {error,userId:adminId} = await requireAdmin();
        if(error){
            return error;
        }

        await connectDB();

        const {id} = await params;
        const {role} = await request.json();

        if(!ROLES.includes(role)){
            return new Response('Invalid role',{status:400});
        }

        // An admin changing their own role could lock the last admin out of the
        // panel, so it has to be done by another admin (or via ADMIN_EMAILS).
        if(id === adminId){
            return new Response('You cannot change your own role',{status:400});
        }

        const user = await User.findById(id);
        if(!user){
            return new Response('User Not Found',{status:404});
        }

        user.role = role;
        await user.save();

        return new Response(JSON.stringify({
            _id:user._id,
            username:user.username,
            email:user.email,
            role:user.role
        }),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};
