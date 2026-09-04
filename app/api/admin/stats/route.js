import connectDB from "@/config/database";
import Property from "@/models/Property";
import User from "@/models/User";
import { requireAdmin } from "@/utils/requireAdmin";
import { PUBLIC_PROPERTY_FILTER } from "@/utils/propertyVisibility";

// GET /api/admin/stats
// The numbers behind the dashboard tiles.
export const GET = async ()=>{
    try{
        const {error} = await requireAdmin();
        if(error){
            return error;
        }

        await connectDB();

        const [byStatus,byRole,featured,live,totalUsers] = await Promise.all([
            // documents with no status are legacy approved ones
            Property.aggregate([
                {$group:{_id:{$ifNull:['$status','approved']},count:{$sum:1}}}
            ]),
            // same idea for accounts created before roles existed
            User.aggregate([
                {$group:{_id:{$ifNull:['$role','tenant']},count:{$sum:1}}}
            ]),
            Property.countDocuments({is_featured:true}),
            Property.countDocuments(PUBLIC_PROPERTY_FILTER),
            User.countDocuments({})
        ]);

        const properties = {pending:0,approved:0,rejected:0,flagged:0};
        for(const row of byStatus){
            if(Object.hasOwn(properties,row._id)){
                properties[row._id] = row.count;
            }
        }

        const users = {tenant:0,landlord:0,admin:0};
        for(const row of byRole){
            if(Object.hasOwn(users,row._id)){
                users[row._id] = row.count;
            }
        }

        return new Response(JSON.stringify({
            properties:{
                ...properties,
                featured,
                live,
                total:Object.values(properties).reduce((sum,count)=> sum + count,0)
            },
            users:{
                ...users,
                total:totalUsers
            }
        }),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
};
