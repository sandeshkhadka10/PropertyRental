import crypto from 'crypto';
import connectDB from '@/config/database';
import Booking from '@/models/Booking';
import {getSessionUser} from '@/utils/getSessionUser';
import {paymentInitiateSchema} from '@/lib/paymentSchema';
import {calculateDepositAmount} from '@/utils/depositPricing';
import {buildEsewaCheckout} from '@/lib/payments/esewa';
import {initiateKhaltiPayment, isKhaltiEnabled, toPaisa, KHALTI_MIN_PAISA} from '@/lib/payments/khalti';
import {resolveBaseUrl} from '@/lib/payments/callbacks';

export const dynamic = 'force-dynamic';

// POST /api/payments/initiate
// Starts a deposit payment for a booking the owner has already accepted.
// The amount always comes from the booking row - nothing about the price is
// read from the request body.
export const POST = async (request) => {
    try{
        await connectDB();

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.userId){
            return new Response(JSON.stringify({message:'You must be logged in'}),{status:401});
        }
        const {userId} = sessionUser;

        const parsed = paymentInitiateSchema.safeParse(await request.json());
        if(!parsed.success){
            return new Response(
                JSON.stringify({message: parsed.error.issues[0].message}),
                {status:400}
            );
        }
        const {bookingId, gateway} = parsed.data;

        const booking = await Booking.findById(bookingId).populate('property','name');
        if(!booking){
            return new Response(JSON.stringify({message:'Booking not found'}),{status:404});
        }

        // Only the guest pays, and only for their own stay.
        if(booking.guest.toString() !== userId){
            return new Response(JSON.stringify({message:'Unauthorized'}),{status:401});
        }
        if(booking.deposit?.status === 'paid'){
            return new Response(
                JSON.stringify({message:'This deposit has already been paid'}),
                {status:400}
            );
        }
        // The deposit secures an accepted booking, so there is nothing to pay
        // while the request is still sitting with the owner - and nothing to
        // refund if they turn it down.
        if(booking.status !== 'confirmed'){
            const reason = booking.status === 'pending'
                ? 'The owner has not confirmed this booking yet'
                : `A ${booking.status} booking cannot take a deposit`;
            return new Response(JSON.stringify({message:reason}),{status:400});
        }

        const amount = booking.deposit?.amount ?? calculateDepositAmount(booking.totalPrice);
        if(!amount || amount <= 0){
            return new Response(
                JSON.stringify({message:'This booking has no deposit to pay'}),
                {status:400}
            );
        }

        if(gateway === 'khalti'){
            if(!isKhaltiEnabled()){
                return new Response(
                    JSON.stringify({message:'Khalti is not configured on this server'}),
                    {status:400}
                );
            }
            // Sending a bumped-up amount would break the check on the callback,
            // so a deposit under Khalti's floor is refused rather than rounded.
            if(toPaisa(amount) < KHALTI_MIN_PAISA){
                return new Response(
                    JSON.stringify({message:'This deposit is below the Rs 10 Khalti minimum - pay with eSewa instead'}),
                    {status:400}
                );
            }
        }

        // A finished-but-unsuccessful attempt gets a fresh id so the wallet sees
        // a new transaction; an attempt still in flight keeps its id so the guest
        // can simply finish the one they started.
        if(!booking.deposit?.transactionUuid || ['failed','cancelled'].includes(booking.deposit?.status)){
            booking.deposit.transactionUuid = crypto.randomUUID();
            booking.deposit.pidx = undefined;
            booking.deposit.referenceId = undefined;
            booking.deposit.gatewayResponse = undefined;
        }

        const baseUrl = resolveBaseUrl(request);
        const transactionUuid = booking.deposit.transactionUuid;

        booking.deposit.amount = amount;
        booking.deposit.gateway = gateway;
        booking.deposit.status = 'pending';

        if(gateway === 'esewa'){
            const {action, fields} = buildEsewaCheckout({
                amount,
                transactionUuid,
                successUrl:`${baseUrl}/api/payments/esewa/callback`,
                failureUrl:`${baseUrl}/api/payments/esewa/callback?result=failure&transaction_uuid=${transactionUuid}`
            });

            await booking.save();

            // eSewa expects a browser form POST, so the fields go back to the
            // client to submit rather than a URL for it to follow.
            return new Response(
                JSON.stringify({gateway, method:'form', action, fields, amount}),
                {status:200}
            );
        }

        const {pidx, paymentUrl} = await initiateKhaltiPayment({
            amount,
            purchaseOrderId:transactionUuid,
            purchaseOrderName:`Deposit - ${booking.property?.name ?? 'Property booking'}`,
            returnUrl:`${baseUrl}/api/payments/khalti/callback`,
            websiteUrl:baseUrl,
            customer:{
                name:sessionUser.user?.name,
                email:sessionUser.user?.email
            }
        });

        booking.deposit.pidx = pidx;
        await booking.save();

        return new Response(
            JSON.stringify({gateway, method:'redirect', paymentUrl, amount}),
            {status:200}
        );
    }catch(error){
        console.log(error);
        return new Response(
            JSON.stringify({message: error.message || 'Could not start the payment'}),
            {status:502}
        );
    }
};
