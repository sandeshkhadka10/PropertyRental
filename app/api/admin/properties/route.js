import connectDB from "@/config/database";
import Property from "@/models/Property";
// imported for its side effect: populate('owner') below needs the User model
// registered on the mongoose connection
import "@/models/User";
import { requireAdmin } from "@/utils/requireAdmin";
import { PUBLIC_PROPERTY_FILTER } from "@/utils/propertyVisibility";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// The queue tabs. 'approved' has to go through the shared filter so that
// listings predating moderation are counted in the same place they are shown.
const STATUS_FILTERS = {
    pending:{status:'pending'},
    approved:PUBLIC_PROPERTY_FILTER,
    rejected:{status:'rejected'},
    flagged:{status:'flagged'}
};

const escapeRegExp = (value)=> value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// GET /api/admin/properties?status=pending&q=&page=1&pageSize=10
export const GET = async (request)=>{
    try{
        const {error} = await requireAdmin();
        if(error){
            return error;
        }

        await connectDB();

        const {searchParams} = new URL(request.url);
        const status = searchParams.get('status') || 'pending';
        const search = (searchParams.get('q') || '').trim();

        const page = Math.max(Number(searchParams.get('page')) || 1,1);
        const pageSize = Math.min(
            Math.max(Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE,1),
            MAX_PAGE_SIZE
        );

        const conditions = [];

        if(Object.hasOwn(STATUS_FILTERS,status)){
            conditions.push(STATUS_FILTERS[status]);
        }

        if(search){
            const pattern = new RegExp(escapeRegExp(search),'i');
            conditions.push({
                $or:[
                    {name:pattern},
                    {'location.city':pattern},
                    {'location.state':pattern}
                ]
            });
        }

        const query = conditions.length > 0 ? {$and:conditions} : {};

        const [total,properties,grouped] = await Promise.all([
            Property.countDocuments(query),
            Property
                .find(query)
                .sort({createdAt:-1})
                .skip((page - 1) * pageSize)
                .limit(pageSize)
                .populate('owner','username email image role')
                .lean(),
            // one pass for the tab badges. Listings with no status are legacy
            // approved ones, see utils/propertyVisibility.js
            Property.aggregate([
                {$group:{_id:{$ifNull:['$status','approved']},count:{$sum:1}}}
            ])
        ]);

        const counts = {pending:0,approved:0,rejected:0,flagged:0};
        for(const row of grouped){
            if(Object.hasOwn(counts,row._id)){
                counts[row._id] = row.count;
            }
        }

        return new Response(JSON.stringify({
            total,
            page,
            pageSize,
            status,
            counts,
            properties
        }),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};
