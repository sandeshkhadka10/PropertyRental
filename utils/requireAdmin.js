import connectDB from "@/config/database";
import User from "@/models/User";
import { getSessionUser } from "@/utils/getSessionUser";

// Guard for the /api/admin/* handlers.
//
// The role is re-read from the database rather than taken from the session, so
// that demoting an admin takes effect on their very next request instead of
// whenever their session happens to be refreshed.
//
// Returns {admin} on success, or {error: Response} that the caller returns
// straight back to the client.
export const requireAdmin = async ()=>{
    await connectDB();

    const sessionUser = await getSessionUser();
    if(!sessionUser || !sessionUser.userId){
        return {error:new Response('Unauthorized',{status:401})};
    }

    const admin = await User.findById(sessionUser.userId).select('role username email');
    if(!admin || admin.role !== 'admin'){
        return {error:new Response('Admin access required',{status:403})};
    }

    return {admin,userId:sessionUser.userId};
};
