/*
 * One-off backfill for the moderation and role fields.
 *
 *   node --env-file=.env.local scripts/backfill-property-status.js
 *
 * Schema defaults only apply to documents created after the field exists, so
 * everything already in the database is missing `Property.status` and
 * `User.role`. The app copes with that on its own: a property with no status is
 * treated as approved (utils/propertyVisibility.js) and a user with no role is
 * treated as a tenant. This script makes that explicit so the queries stop
 * needing the $exists fallback and the admin counts line up exactly.
 *
 * It only touches documents that are missing the field, so it is safe to run
 * more than once.
 *
 * Pass --dry to see what it would do without writing anything.
 */
const mongoose = require('mongoose');

const dryRun = process.argv.includes('--dry');

const run = async ()=>{
    const uri = process.env.MONGODB_URL;
    if(!uri){
        console.error('MONGODB_URL is not set. Try: node --env-file=.env.local scripts/backfill-property-status.js');
        process.exit(1);
    }

    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const propertyFilter = {status:{$exists:false}};
    const userFilter = {role:{$exists:false}};

    const [propertiesToFix,usersToFix] = await Promise.all([
        db.collection('properties').countDocuments(propertyFilter),
        db.collection('users').countDocuments(userFilter)
    ]);

    console.log(`properties without a status: ${propertiesToFix}`);
    console.log(`users without a role: ${usersToFix}`);

    if(dryRun){
        console.log('--dry given, nothing written.');
        await mongoose.disconnect();
        return;
    }

    // Listings that were already live before moderation existed stay live.
    const properties = await db.collection('properties').updateMany(
        propertyFilter,
        {$set:{status:'approved'}}
    );

    // Anyone who owns a listing was acting as a landlord, everyone else is a
    // tenant and can upgrade themselves from their profile.
    const ownerIds = await db.collection('properties').distinct('owner');

    const landlords = await db.collection('users').updateMany(
        {...userFilter,_id:{$in:ownerIds}},
        {$set:{role:'landlord'}}
    );
    const tenants = await db.collection('users').updateMany(
        userFilter,
        {$set:{role:'tenant'}}
    );

    console.log(`properties marked approved: ${properties.modifiedCount}`);
    console.log(`users marked landlord: ${landlords.modifiedCount}`);
    console.log(`users marked tenant: ${tenants.modifiedCount}`);
    console.log('Set ADMIN_EMAILS in your env and sign in again to get an admin account.');

    await mongoose.disconnect();
};

run().catch(async (error)=>{
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
