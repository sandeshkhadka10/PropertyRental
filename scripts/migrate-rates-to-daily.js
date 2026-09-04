/*
 * One-off migration to the single day rate.
 *
 *   node --env-file=.env.local scripts/migrate-rates-to-daily.js
 *
 * A stay used to be priced from whichever of nightly/weekly/monthly an owner
 * had filled in, picking the cheapest combination of them. It is now one rate
 * charged once per day of the stay, so `rates` holds `daily` and nothing else.
 *
 * Each listing keeps the closest thing it already had to a day rate:
 *
 *   nightly            -> daily, unchanged (a night and a day of stay are the
 *                         same unit here: arrive any time, leave by 12:00)
 *   weekly, no nightly -> weekly / 7,  rounded
 *   monthly only       -> monthly / 30, rounded
 *
 * A listing with no usable rate at all ends up with daily: null, which the app
 * already reads as "no rate set" - it stays visible but cannot be booked until
 * its owner puts a day rate in. The old three fields are dropped either way.
 *
 * Bookings get their `nights` count renamed to `days`. Their priceBreakdown is
 * deliberately left alone: it is the snapshot of what was actually agreed, so a
 * stay priced as "1 month + 1 week" has to keep saying so.
 *
 * Only documents still holding the old shape are touched, so it is safe to run
 * more than once. Pass --dry to see what it would do without writing anything.
 */
const mongoose = require('mongoose');

const dryRun = process.argv.includes('--dry');

// A rate can be a String on older documents, so it is converted before any
// arithmetic - the same read the search route does.
const toDouble = (path)=>({
    $convert:{input:path,to:'double',onError:null,onNull:null}
});

const perDay = (path,divisor)=>({
    $round:[{$divide:[toDouble(path),divisor]},0]
});

const run = async ()=>{
    const uri = process.env.MONGODB_URL;
    if(!uri){
        console.error('MONGODB_URL is not set. Try: node --env-file=.env.local scripts/migrate-rates-to-daily.js');
        process.exit(1);
    }

    await mongoose.connect(uri);
    const db = mongoose.connection.db;

    const propertyFilter = {'rates.daily':{$exists:false}};
    const bookingFilter = {nights:{$exists:true}};

    const [propertiesToFix,bookingsToFix,withoutAnyRate] = await Promise.all([
        db.collection('properties').countDocuments(propertyFilter),
        db.collection('bookings').countDocuments(bookingFilter),
        db.collection('properties').countDocuments({
            'rates.daily':{$exists:false},
            'rates.nightly':{$exists:false},
            'rates.weekly':{$exists:false},
            'rates.monthly':{$exists:false}
        })
    ]);

    console.log(`properties still on the old rates: ${propertiesToFix}`);
    console.log(`bookings still counting nights: ${bookingsToFix}`);
    if(withoutAnyRate > 0){
        console.log(`${withoutAnyRate} of those properties have no rate at all and will need one from their owner before they can be booked.`);
    }

    if(dryRun){
        console.log('--dry given, nothing written.');
        await mongoose.disconnect();
        return;
    }

    // Worked out per document, so this runs as an aggregation pipeline update
    // rather than a plain $set.
    const properties = await db.collection('properties').updateMany(
        propertyFilter,
        [
            {
                $set:{
                    'rates.daily':{
                        $ifNull:[
                            toDouble('$rates.nightly'),
                            {
                                $ifNull:[
                                    perDay('$rates.weekly',7),
                                    perDay('$rates.monthly',30)
                                ]
                            }
                        ]
                    }
                }
            },
            {$unset:['rates.nightly','rates.weekly','rates.monthly']}
        ]
    );

    const bookings = await db.collection('bookings').updateMany(
        bookingFilter,
        {$rename:{nights:'days'}}
    );

    console.log(`properties moved to a day rate: ${properties.modifiedCount}`);
    console.log(`bookings moved to a day count: ${bookings.modifiedCount}`);

    await mongoose.disconnect();
};

run().catch(async (error)=>{
    console.error(error);
    await mongoose.disconnect();
    process.exit(1);
});
