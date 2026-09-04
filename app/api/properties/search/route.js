import connectDB from "@/config/database";
import Property from "@/models/Property";
import { publicPropertyQuery } from "@/utils/propertyVisibility";
import { withAvailability } from "@/utils/loadPropertyAvailability";

const DEFAULT_PAGE_SIZE = 9;
const MAX_PAGE_SIZE = 48;
const DEFAULT_RADIUS_KM = 10;
const MAX_RADIUS_KM = 200;

// When a keyword search is combined with "near me" the matching ids have to be
// resolved up front (see below). This caps how many ids we hand to $geoNear.
const TEXT_PREFILTER_LIMIT = 5000;

// Whitelisted so nothing user-supplied ever reaches the query planner as a
// field name or direction. _id breaks ties, which keeps pagination stable when
// several properties share a price or timestamp.
const SORT_OPTIONS = {
    relevance:{score:-1,createdAt:-1,_id:1},
    newest:{createdAt:-1,_id:1},
    oldest:{createdAt:1,_id:1},
    price_asc:{price_daily:1,_id:1},
    price_desc:{price_daily:-1,_id:1},
    rating:{rating_avg:-1,rating_count:-1,_id:1},
    distance:{distance:1,_id:1}
};

const parseNumber = (value)=>{
    if(value === null || value === undefined || value === ''){
        return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value,min,max)=> Math.min(Math.max(value,min),max);

// The property type comes from a fixed <select>, but it is still user input, so
// it gets escaped before it is anchored into a case-insensitive exact match.
// That tolerates the casing drift in the existing data ("Cottage Or Cabin" vs
// "Cottage or Cabin") without letting anyone hand us a pattern of their own.
const escapeRegExp = (value)=> value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');

// Reads a value as a number in the source data even when it was written as a
// string, which is how some rates were stored before the schema was fixed.
const toDouble = (path)=>({
    $convert:{input:path,to:'double',onError:null,onNull:null}
});

// GET /api/properties/search
export const GET = async(request)=>{
    try{
        await connectDB();

        const {searchParams} = new URL(request.url);

        const keywords = (searchParams.get('location') || '').trim();
        const propertyType = searchParams.get('propertyType');

        const minPrice = parseNumber(searchParams.get('minPrice'));
        const maxPrice = parseNumber(searchParams.get('maxPrice'));
        const minBeds = parseNumber(searchParams.get('minBeds'));
        const minBaths = parseNumber(searchParams.get('minBaths'));

        const amenities = (searchParams.get('amenities') || '')
            .split(',')
            .map((amenity)=> amenity.trim())
            .filter(Boolean);

        const lat = parseNumber(searchParams.get('lat'));
        const lng = parseNumber(searchParams.get('lng'));
        const hasGeo =
            lat !== null && lng !== null &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180;

        const radiusKm = clamp(
            parseNumber(searchParams.get('radius')) ?? DEFAULT_RADIUS_KM,
            1,
            MAX_RADIUS_KM
        );

        const page = Math.max(Math.trunc(parseNumber(searchParams.get('page')) ?? 1),1);
        const pageSize = clamp(
            Math.trunc(parseNumber(searchParams.get('pageSize')) ?? DEFAULT_PAGE_SIZE),
            1,
            MAX_PAGE_SIZE
        );

        // Everything that can be matched straight against an index. Price is
        // missing on purpose: it is a computed field, so it is matched later.
        const filters = {};

        if(propertyType && propertyType !== 'All'){
            filters.type = new RegExp(`^${escapeRegExp(propertyType)}$`,'i');
        }
        if(minBeds !== null){
            filters.beds = {$gte:minBeds};
        }
        if(minBaths !== null){
            filters.baths = {$gte:minBaths};
        }
        if(amenities.length > 0){
            // $all, not $in: a property has to offer every amenity that was ticked
            filters.amenities = {$all:amenities};
        }

        const pipeline = [];
        let usingText = false;

        if(hasGeo){
            // $geoNear has to be the first stage of the pipeline and its `query`
            // option cannot carry $text, so when both are in play the keyword
            // match is resolved to a set of ids first and fed in as a filter.
            // Both halves still run off an index.
            let geoQuery = publicPropertyQuery(filters);

            if(keywords){
                const textQuery = publicPropertyQuery(filters);
                // $text has to sit at the top level of the query, never inside
                // the $or that publicPropertyQuery adds
                textQuery.$text = {$search:keywords};

                const textMatches = await Property
                    .find(textQuery,{_id:1})
                    .limit(TEXT_PREFILTER_LIMIT)
                    .lean();

                geoQuery = publicPropertyQuery({
                    ...filters,
                    _id:{$in:textMatches.map((doc)=> doc._id)}
                });
                usingText = true;
            }

            pipeline.push({
                $geoNear:{
                    near:{type:'Point',coordinates:[lng,lat]},
                    distanceField:'distance',
                    distanceMultiplier:0.001, // metres -> km
                    maxDistance:radiusKm * 1000,
                    spherical:true,
                    query:geoQuery
                }
            });

            pipeline.push({
                $addFields:{distance:{$round:['$distance',1]}}
            });
        }else{
            const match = publicPropertyQuery(filters);

            if(keywords){
                // Replaces the old per-term RegExp. The text index is faster and
                // it means no user input is ever compiled into a pattern.
                // Kept at the top level: $text is not allowed inside an $or.
                match.$text = {$search:keywords};
                usingText = true;
            }

            pipeline.push({$match:match});

            if(usingText){
                pipeline.push({$addFields:{score:{$meta:'textScore'}}});
            }
        }

        // Every listing is priced by the day, so the day rate is what the price
        // filter and the price sort both work off. null when it is missing or
        // unreadable, which drops the listing out of a price-filtered search.
        pipeline.push({
            $addFields:{
                price_daily:toDouble('$rates.daily')
            }
        });

        if(minPrice !== null || maxPrice !== null){
            const priceRange = {};
            if(minPrice !== null){
                priceRange.$gte = minPrice;
            }
            if(maxPrice !== null){
                priceRange.$lte = maxPrice;
            }
            // Listings with no usable rate drop out here, which is right: we
            // cannot say whether they fall inside the range.
            pipeline.push({$match:{price_daily:priceRange}});
        }

        // Fall back to whatever makes sense for the query that was actually run
        // rather than trusting the requested key.
        let sort = searchParams.get('sort');
        if(!Object.hasOwn(SORT_OPTIONS,sort ?? '')){
            sort = hasGeo ? 'distance' : (usingText ? 'relevance' : 'newest');
        }
        if(sort === 'distance' && !hasGeo){
            sort = 'newest';
        }
        if(sort === 'relevance' && (!usingText || hasGeo)){
            // in geo mode the text score was consumed by the id prefilter and
            // is not carried on the documents
            sort = hasGeo ? 'distance' : 'newest';
        }

        pipeline.push({$sort:SORT_OPTIONS[sort]});

        // One round trip for both the page and the total it is counted against.
        pipeline.push({
            $facet:{
                total:[{$count:'count'}],
                properties:[
                    {$skip:(page - 1) * pageSize},
                    {$limit:pageSize},
                    {$project:{score:0}}
                ]
            }
        });

        const [result] = await Property.aggregate(pipeline);

        const payload = {
            total: result?.total?.[0]?.count ?? 0,
            page,
            pageSize,
            sort,
            properties: await withAvailability(result?.properties ?? [])
        };

        return new Response(JSON.stringify(payload),{status:200});
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
}
