// Everything the public side of the site is allowed to see.
//
// Listings created before moderation existed have no `status` field at all, and
// a schema default only applies to new documents. Treating a missing status as
// approved keeps those rows live instead of emptying the site the moment this
// ships. Run scripts/backfill-property-status.js to stamp them, after which the
// $exists arm simply never matches anything.
export const PUBLIC_PROPERTY_FILTER = {
    $or:[
        {status:'approved'},
        {status:{$exists:false}}
    ]
};

// Wraps a query so it only ever returns publicly visible listings.
// $and is used rather than spreading, because the search route already puts its
// own $and/$or on the query and a plain spread would overwrite one of them.
export const publicPropertyQuery = (query = {})=>{
    if(Object.keys(query).length === 0){
        return {...PUBLIC_PROPERTY_FILTER};
    }
    return {$and:[query,PUBLIC_PROPERTY_FILTER]};
};

// A listing is public once approved (or legacy, see above). Anything else is
// visible only to the landlord who owns it and to admins, so an owner can still
// open their own pending listing and read the rejection note.
export const canViewProperty = (property,viewer)=>{
    if(!property){
        return false;
    }

    if(!property.status || property.status === 'approved'){
        return true;
    }

    if(!viewer || !viewer.userId){
        return false;
    }

    if(viewer.role === 'admin'){
        return true;
    }

    return property.owner?.toString() === viewer.userId;
};
