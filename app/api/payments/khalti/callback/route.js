import connectDB from '@/config/database';
import Booking from '@/models/Booking';
import {lookupKhaltiPayment, toPaisa} from '@/lib/payments/khalti';
import {redirectToBooking, resolveBaseUrl} from '@/lib/payments/callbacks';

export const dynamic = 'force-dynamic';

// GET /api/payments/khalti/callback
//
// Khalti puts the outcome straight in the query string, which means anyone
// could type it. Nothing here trusts it: the pidx is looked up server-side and
// only a `Completed` status for the exact amount we recorded marks a deposit paid.
export const GET = async (request) => {
    const baseUrl = resolveBaseUrl(request);

    try{
        await connectDB();
        const {searchParams} = new URL(request.url);

        const pidx = searchParams.get('pidx');
        const purchaseOrderId = searchParams.get('purchase_order_id');
        if(!pidx && !purchaseOrderId){
            return redirectToBooking(baseUrl, null, 'invalid');
        }

        const booking = await Booking.findOne(
            purchaseOrderId
                ? {'deposit.transactionUuid': purchaseOrderId}
                : {'deposit.pidx': pidx}
        );
        if(!booking){
            return redirectToBooking(baseUrl, null, 'unknown');
        }
        if(booking.deposit.status === 'paid'){
            return redirectToBooking(baseUrl, booking._id, 'success');
        }

        const lookup = await lookupKhaltiPayment(pidx || booking.deposit.pidx);
        booking.deposit.gatewayResponse = {
            callback: Object.fromEntries(searchParams),
            lookup
        };

        // Khalti works in paisa; the booking stores rupees.
        const amountMatches = Number(lookup?.total_amount) === toPaisa(booking.deposit.amount);

        if(lookup?.status === 'Completed' && amountMatches){
            booking.deposit.status = 'paid';
            booking.deposit.referenceId = lookup.transaction_id;
            booking.deposit.paidAt = new Date();
            await booking.save();
            return redirectToBooking(baseUrl, booking._id, 'success');
        }

        if(['Pending','Initiated'].includes(lookup?.status)){
            booking.deposit.status = 'pending';
            await booking.save();
            return redirectToBooking(baseUrl, booking._id, 'pending');
        }

        booking.deposit.status = lookup?.status === 'User canceled' ? 'cancelled' : 'failed';
        await booking.save();
        return redirectToBooking(
            baseUrl,
            booking._id,
            booking.deposit.status === 'cancelled' ? 'cancelled' : 'failed'
        );
    }catch(error){
        console.log(error);
        return redirectToBooking(baseUrl, null, 'error');
    }
};
