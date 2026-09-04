import connectDB from '@/config/database';
import Booking from '@/models/Booking';
import {toAmount} from '@/utils/formatCurrency';
import {
    decodeEsewaCallback,
    fetchEsewaTransactionStatus,
    verifyEsewaCallbackSignature
} from '@/lib/payments/esewa';
import {redirectToBooking, resolveBaseUrl} from '@/lib/payments/callbacks';

export const dynamic = 'force-dynamic';

// GET /api/payments/esewa/callback
//
// This is eSewa sending the guest's browser back to us, so there is no session
// to check and nothing in the query string can be taken at face value. The
// request is authenticated by the HMAC signature on the payload, and then the
// payment is confirmed against eSewa's own status API before a single field is
// treated as proof that money moved.
export const GET = async (request) => {
    const baseUrl = resolveBaseUrl(request);

    try{
        await connectDB();
        const {searchParams} = new URL(request.url);

        // eSewa uses failure_url for a declined or abandoned payment.
        if(searchParams.get('result') === 'failure'){
            const failed = await Booking.findOne({
                'deposit.transactionUuid': searchParams.get('transaction_uuid')
            });
            if(failed && failed.deposit.status !== 'paid'){
                failed.deposit.status = 'failed';
                await failed.save();
            }
            return redirectToBooking(baseUrl, failed?._id, 'failed');
        }

        const decoded = decodeEsewaCallback(searchParams.get('data'));
        const payload = decoded?.payload;
        if(!payload?.transaction_uuid){
            return redirectToBooking(baseUrl, null, 'invalid');
        }
        // Verified against the undecoded JSON, so the amount is checked exactly
        // as eSewa wrote it.
        if(!verifyEsewaCallbackSignature(decoded)){
            console.log('eSewa callback signature mismatch for', payload.transaction_uuid);
            return redirectToBooking(baseUrl, null, 'invalid');
        }

        const booking = await Booking.findOne({
            'deposit.transactionUuid': payload.transaction_uuid
        });
        if(!booking){
            return redirectToBooking(baseUrl, null, 'unknown');
        }
        // Re-entering the callback (browser back, a refresh, a double redirect)
        // must not re-confirm anything or overwrite the receipt.
        if(booking.deposit.status === 'paid'){
            return redirectToBooking(baseUrl, booking._id, 'success');
        }

        const status = await fetchEsewaTransactionStatus({
            transactionUuid: payload.transaction_uuid,
            totalAmount: booking.deposit.amount
        });

        // Guards against a signed payload for a different, cheaper transaction.
        const paidAmount = toAmount(payload.total_amount);
        const amountMatches =
            paidAmount !== null && Math.round(paidAmount) === Math.round(booking.deposit.amount);

        booking.deposit.gatewayResponse = {callback:payload, status};

        if(status?.status === 'COMPLETE' && amountMatches){
            booking.deposit.status = 'paid';
            booking.deposit.referenceId = status.ref_id || payload.transaction_code;
            booking.deposit.paidAt = new Date();
            await booking.save();
            return redirectToBooking(baseUrl, booking._id, 'success');
        }

        if(status?.status === 'PENDING'){
            booking.deposit.status = 'pending';
            await booking.save();
            return redirectToBooking(baseUrl, booking._id, 'pending');
        }

        booking.deposit.status = status?.status === 'CANCELED' ? 'cancelled' : 'failed';
        await booking.save();
        return redirectToBooking(baseUrl, booking._id, 'failed');
    }catch(error){
        console.log(error);
        return redirectToBooking(baseUrl, null, 'error');
    }
};
