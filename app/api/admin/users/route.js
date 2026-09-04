import connectDB from "@/config/database";
import User from "@/models/User";
import Property from "@/models/Property";
import { requireAdmin } from "@/utils/requireAdmin";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const ROLES = ['tenant','landlord','admin'];

const escapeRegExp = (value)=> value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// GET /api/admin/users?role=&q=&page=1&pageSize=20
export const GET = async (request)=>{
    try{
        const {error} = await requireAdmin();
        if(error){
            return error;
        }

        await connectDB();

        const {searchParams} = new URL(request.url);
        const role = searchParams.get('role');
        const search = (searchParams.get('q') || '').trim();

        const page = Math.max(Number(searchParams.get('page')) || 1,1);
        const pageSize = Math.min(
            Math.max(Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE,1),
            MAX_PAGE_SIZE
        );

        const query = {};

        if(role && ROLES.includes(role)){
            // accounts created before roles existed have no field at all and
            // are treated as tenants, the same as the schema default
            query.role = role === 'tenant' ? {$in:['tenant',null]} : role;
        }

        if(search){
            const pattern = new RegExp(escapeRegExp(search),'i');
            query.$or = [{username:pattern},{email:pattern}];
        }

        const [total,users] = await Promise.all([
            User.countDocuments(query),
            User
                .find(query)
                .select('username email image role createdAt bookmarks')
                .sort({createdAt:-1})
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .lean()
        ]);

        // How many listings each user on this page owns, in one round trip
        // rather than one query per row.
        const listingCounts = await Property.aggregate([
            {$match:{owner:{$in:users.map((user)=> user._id)}}},
            {$group:{_id:'$owner',count:{$sum:1}}}
        ]);
        const countByOwner = new Map(
            listingCounts.map((row)=> [row._id.toString(),row.count])
        );

        const rows = users.map((user)=>({
            _id:user._id,
            username:user.username,
            email:user.email,
            image:user.image,
            role:user.role || 'tenant',
            createdAt:user.createdAt,
            bookmarkCount:user.bookmarks?.length || 0,
            listingCount:countByOwner.get(user._id.toString()) || 0
        }));

        return new Response(JSON.stringify({
            total,
            page,
            pageSize,
            users:rows
        }),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};
