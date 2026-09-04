'use client';
import {useSearchParams} from 'next/navigation';

// What each `?payment=` value the callback routes redirect with means to the guest.
const RESULTS = {
    success:{
        tone:'bg-green-50 border-green-200 text-green-800',
        message:'Deposit received. Your booking is secured.'
    },
    pending:{
        tone:'bg-yellow-50 border-yellow-200 text-yellow-800',
        message:'The wallet is still settling this payment. Refresh in a moment to see the result.'
    },
    failed:{
        tone:'bg-red-50 border-red-200 text-red-800',
        message:'That payment did not go through. Nothing was charged - you can try again.'
    },
    cancelled:{
        tone:'bg-gray-50 border-gray-200 text-gray-700',
        message:'You cancelled the payment. Your dates are still held.'
    },
    invalid:{
        tone:'bg-red-50 border-red-200 text-red-800',
        message:'That payment response could not be verified, so it was rejected.'
    },
    unknown:{
        tone:'bg-red-50 border-red-200 text-red-800',
        message:'We could not match that payment to a booking.'
    },
    error:{
        tone:'bg-red-50 border-red-200 text-red-800',
        message:'Something went wrong while confirming the payment. Check the booking before retrying.'
    }
};

const PaymentResultBanner = () => {
    const result = RESULTS[useSearchParams().get('payment')];

    if(!result){
        return null;
    }

    return (
        <div className={`border rounded-lg p-4 mb-6 text-sm ${result.tone}`}>
            {result.message}
        </div>
    );
};

export default PaymentResultBanner;
