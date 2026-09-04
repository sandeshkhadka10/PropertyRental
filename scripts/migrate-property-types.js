/*
 * One-off migration for the Nepal-specific property type list.
 *
 *   node --env-file=.env.local scripts/migrate-property-types.js
 *
 * The type list used to be the US template one (Condo, Chalet, Loft). Those
 * options are gone from the forms, so any listing still stored under one of
 * them can no longer be reproduced by a landlord and drops out of the
 * search-by-type filter. This rewrites each retired value to its replacement,
 * per LEGACY_PROPERTY_TYPES in lib/propertyTypes.js.
 *
 * Matching is case-insensitive and anchored, because the type was never an enum
 * on the schema and older documents were written straight from the form value.
 *
 * Listings stored as 'Other' are reported but never rewritten - that option
 * could have meant anything, so the owner has to pick a real type on their next
 * edit rather than have one guessed for them.
 *
 * It only touches documents holding a retired type, so it is safe to run more
 * than once. Pass --dry to see what it would do without writing anything.
 */
const mongoose = require('mongoose');

// Kept in step with LEGACY_PROPERTY_TYPES in lib/propertyTypes.js. Duplicated
// rather than imported: that module is ESM and this script is CommonJS, like
// the other backfill beside it.
const REPLACEMENTS = {
    'Apartment':'Flat Or Apartment',
    'Flat':'Flat Or Apartment',
    'Condo':'Flat Or Apartment',
    'Loft':'Flat Or Apartment',
    'Room':'Private Room',
    'Hostel Or PG':'Hostel Or Dorm',
    'Chalet':'Cottage Or Cabin',
    'Cabin Or Cottage':'Cottage Or Cabin'
};

// Retired with no sensible replacement, so they are only counted.
const NEEDS_A_HUMAN = ['Other','Shutter Or Shop'];

const dryRun = process.argv.includes('--dry');

const exactly = (value)=>new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}$`,'i');

const run = async ()=>{
    const uri = process.env.MONGODB_URL;
    if(!uri){
        console.error('MONGODB_URL is not set. Try: node --env-file=.env.local scripts/migrate-property-types.js');
        process.exit(1);
    }

    await mongoose.connect(uri);
    const properties = mongoose.connection.db.collection('properties');

    let total = 0;

    for(const [oldType,newType] of Object.entries(REPLACEMENTS)){
        const filter = {type:exactly(oldType)};

        if(dryRun){
            const count = await properties.countDocuments(filter);
            console.log(`${oldType} -> ${newType}: ${count}`);
            total += count;
            continue;
        }

        const result = await properties.updateMany(filter,{$set:{type:newType}});
        console.log(`${oldType} -> ${newType}: ${result.modifiedCount}`);
        total += result.modifiedCount;
    }

    console.log(dryRun ? `${total} properties would be updated. --dry given, nothing written.` : `${total} properties updated.`);

    const stranded = await properties.countDocuments({
        type:{$in:NEEDS_A_HUMAN.map(exactly)}
    });
    if(stranded > 0){
        console.log(`${stranded} properties are still on a retired type (${NEEDS_A_HUMAN.join(', ')}). They stay visible, but cannot be found by the type filter until their owner re-picks a type.`);
    }

    await mongoose.disconnect();
};

run().catch(async (error)=>{
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
