import {Schema,model,models} from "mongoose";

// GeoJSON point kept alongside lat/lng so MongoDB can answer "near me" with a
// 2dsphere index. Note the order: GeoJSON is [lng,lat], the reverse of how we
// store and display it everywhere else.
const PointSchema = new Schema({
    type:{
        type:String,
        enum:['Point'],
        default:'Point'
    },
    coordinates:{
        type:[Number],
        required:true
    }
},{_id:false});

const PropertySchema = new Schema({
    owner:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    name:{
        type:String,
        required:true,
    },
    type:{
        type:String,
        required:true
    },
    description:{
        type:String
    },
    location:{
        city:{
            type:String
        },
        state:{
            type:String
        },
        lat:{
            type:Number
        },
        lng:{
            type:Number
        },
        // derived from lat/lng by the hooks below, never set by hand
        geo:{
            type:PointSchema,
            default:undefined
        }
    },
    beds:{
        type:Number,
        required:true
    },
    baths:{
        type:Number,
        required:true
    },
    square_feet:{
        type:Number,
        required:true
    },
    amenities:[
        {
            type:String
        }
    ],
    // One rate only. A guest arrives any time of day and leaves by 12:00 the
    // following day, so a stay is counted in whole days and every stay is
    // priced the same way: this rate x the number of days.
    // Listings that used to hold weekly/monthly rates are converted by
    // scripts/migrate-rates-to-daily.js
    rates:{
        daily:{
            type:Number
        }
    },
    seller_info:{
        name:{
            type:String
        },
        email:{
            type:String
        },
        phone:{
            type:String
        }
    },
    images:[
        {
            type:String
        }
    ],
    is_featured:{
        type:Boolean,
        default:false
    },
    // Moderation state. A new listing starts as 'pending' and is hidden from
    // every public route until an admin approves it.
    // pending  -> sitting in the admin queue, visible only to its owner
    // approved -> live on the site
    // rejected -> refused by an admin, the owner sees the note and can edit
    // flagged  -> was live, pulled back down by an admin
    status:{
        type:String,
        enum:['pending','approved','rejected','flagged'],
        default:'pending'
    },
    // why an admin rejected or flagged it, shown back to the owner
    moderation_note:{
        type:String
    },
    moderated_at:{
        type:Date
    },
    moderated_by:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    // kept in sync by utils/updatePropertyRating.js whenever a review is
    // written, so cards and 'sort by rating' don't have to aggregate reviews
    rating_avg:{
        type:Number,
        default:0
    },
    rating_count:{
        type:Number,
        default:0
    },
},{timestamps:true});

// Keeps location.geo in step with location.lat/lng. Takes anything that has a
// `location` object, so it serves both documents and update payloads.
const syncGeoPoint = (target)=>{
    const location = target?.location;
    if(!location){
        return;
    }

    const lat = Number(location.lat);
    const lng = Number(location.lng);
    const hasCoordinates =
        Number.isFinite(lat) && Number.isFinite(lng) &&
        lat >= -90 && lat <= 90 &&
        lng >= -180 && lng <= 180;

    // undefined rather than null: a 2dsphere index skips documents that are
    // missing the field, but rejects one holding a malformed point
    location.geo = hasCoordinates
        ? {type:'Point',coordinates:[lng,lat]}
        : undefined;
};

PropertySchema.pre('save',function(next){
    syncGeoPoint(this);
    next();
});

// The edit route goes through findByIdAndUpdate, which skips the save hook, so
// the same normalisation has to run against the update payload. Both routes
// send the whole location object, so there are no dotted paths to handle.
PropertySchema.pre(['findOneAndUpdate','updateOne','updateMany'],function(next){
    const update = this.getUpdate();
    if(update && !Array.isArray(update)){
        if(update.location){
            syncGeoPoint(update);
        }
        if(update.$set?.location){
            syncGeoPoint(update.$set);
        }
    }
    next();
});

// MongoDB allows one text index per collection, so every searchable field goes
// in this one. The weights put a name or city hit above a stray word buried in
// a description.
PropertySchema.index(
    {
        name:'text',
        'location.city':'text',
        'location.state':'text',
        description:'text'
    },
    {
        name:'property_text',
        default_language:'english',
        weights:{
            name:10,
            'location.city':6,
            'location.state':4,
            description:1
        }
    }
);

PropertySchema.index({'location.geo':'2dsphere'});

// Supporting indexes for the structured filters and the default sort.
PropertySchema.index({type:1});
PropertySchema.index({beds:1,baths:1});
PropertySchema.index({amenities:1});
PropertySchema.index({createdAt:-1});
PropertySchema.index({rating_avg:-1});

// every public query is scoped by status, and the admin queue sorts the
// oldest pending listing first
PropertySchema.index({status:1,createdAt:-1});

const Property = models.Property || model('Property',PropertySchema);

export default Property;
