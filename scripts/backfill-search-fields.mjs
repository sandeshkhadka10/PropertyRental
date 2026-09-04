/*
 * One-off migration for the search rewrite. Safe to run more than once.
 *
 *   node --env-file=.env scripts/backfill-search-fields.mjs
 *
 * It does three things to documents that were written before the new schema:
 *   1. rates.* stored as strings become numbers, so price filtering and
 *      sorting compare numerically instead of alphabetically
 *   2. location.geo is derived from location.lat/lng so 2dsphere queries
 *      ("properties near me") can see the existing listings
 *   3. the text, 2dsphere and filter indexes are created, for deployments
 *      that run mongoose with autoIndex disabled
 *
 * It talks to the driver directly rather than through the Property model:
 * the point is to repair values the schema would otherwise cast on the way in.
 */
import mongoose from 'mongoose';

const MONGODB_URL = process.env.MONGODB_URL;

if(!MONGODB_URL){
    console.error('MONGODB_URL is not set. Run with: node --env-file=.env scripts/backfill-search-fields.mjs');
    process.exit(1);
}

// string -> double, missing stays missing, anything unparseable is dropped
const numeric = (path)=>({
    $switch:{
        branches:[
            {
                case:{$eq:[{$type:path},'string']},
                then:{$convert:{input:path,to:'double',onError:'$$REMOVE',onNull:'$$REMOVE'}}
            },
            {
                case:{$eq:[{$type:path},'missing']},
                then:'$$REMOVE'
            }
        ],
        default:path
    }
});

const run = async()=>{
    await mongoose.connect(MONGODB_URL);
    const properties = mongoose.connection.db.collection('properties');

    const rates = await properties.updateMany(
        {
            $or:[
                {'rates.nightly':{$type:'string'}},
                {'rates.weekly':{$type:'string'}},
                {'rates.monthly':{$type:'string'}}
            ]
        },
        [
            {
                $set:{
                    'rates.nightly':numeric('$rates.nightly'),
                    'rates.weekly':numeric('$rates.weekly'),
                    'rates.monthly':numeric('$rates.monthly')
                }
            }
        ]
    );
    console.log(`rates converted to numbers: ${rates.modifiedCount}`);

    const geo = await properties.updateMany(
        {'location.lat':{$type:'number'},'location.lng':{$type:'number'}},
        [
            {
                $set:{
                    'location.geo':{
                        $cond:[
                            {
                                $and:[
                                    {$gte:['$location.lat',-90]},
                                    {$lte:['$location.lat',90]},
                                    {$gte:['$location.lng',-180]},
                                    {$lte:['$location.lng',180]}
                                ]
                            },
                            // GeoJSON is [lng,lat]
                            {type:'Point',coordinates:['$location.lng','$location.lat']},
                            '$$REMOVE'
                        ]
                    }
                }
            }
        ]
    );
    console.log(`geo points written: ${geo.modifiedCount}`);

    // a half-written point would make the 2dsphere index reject the document
    const stale = await properties.updateMany(
        {
            'location.geo':{$exists:true},
            $or:[
                {'location.lat':{$not:{$type:'number'}}},
                {'location.lng':{$not:{$type:'number'}}}
            ]
        },
        {$unset:{'location.geo':''}}
    );
    console.log(`stale geo points removed: ${stale.modifiedCount}`);

    // Mirrors the definitions in models/Property.js
    await properties.createIndexes([
        {
            key:{name:'text','location.city':'text','location.state':'text',description:'text'},
            name:'property_text',
            default_language:'english',
            weights:{name:10,'location.city':6,'location.state':4,description:1}
        },
        {key:{'location.geo':'2dsphere'},name:'location.geo_2dsphere'},
        {key:{type:1},name:'type_1'},
        {key:{beds:1,baths:1},name:'beds_1_baths_1'},
        {key:{amenities:1},name:'amenities_1'},
        {key:{createdAt:-1},name:'createdAt_-1'},
        {key:{rating_avg:-1},name:'rating_avg_-1'}
    ]);
    console.log('indexes ensured');

    const withGeo = await properties.countDocuments({'location.geo':{$exists:true}});
    const total = await properties.countDocuments({});
    console.log(`${withGeo}/${total} properties are searchable by distance`);

    await mongoose.disconnect();
};

run().catch(async(error)=>{
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
