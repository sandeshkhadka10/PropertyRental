'use client';
import {useState} from 'react';
import Link from 'next/link';
import {toast} from 'react-toastify';
import {FaBed, FaMapMarker, FaUserFriends} from 'react-icons/fa';
import {formatNPR} from '@/utils/formatCurrency';

const STATUS_STYLES = {
    pending:'bg-yellow-100 text-yellow-800',
    confirmed:'bg-green-100 text-green-800',
    completed:'bg-gray-200 text-gray-700',
    cancelled:'bg-red-100 text-red-700'
};

// How the deposit stands, for the line under the total.
const DEPOSIT_LABELS = {
    due:'not paid yet',
    pending:'payment in progress',
    paid:'paid',
    failed:'payment failed',
    cancelled:'payment cancelled',
    refunded:'refunded'
};

const DEPOSIT_STYLES = {
    paid:'bg-green-100 text-green-800',
    pending:'bg-yellow-100 text-yellow-800',
    failed:'bg-red-100 text-red-700',
    cancelled:'bg-gray-200 text-gray-700'
};

// Dates are stored at UTC midnight, so they are read back in UTC too - otherwise
// a guest west of Greenwich would see every stay start a day early.
const formatDate = (value) =>
    new Date(value).toLocaleDateString(undefined,{
        timeZone:'UTC',
        day:'numeric',
        month:'short',
        year:'numeric'
    });

// What each side is allowed to do next, mirroring ALLOWED_STATUS_TRANSITIONS
// on the server. The API rejects anything else, this only decides what to draw.
const actionsFor = (perspective, status) => {
    if(perspective === 'request'){
        if(status === 'pending'){
            return [
                {label:'Accept', status:'confirmed', className:'bg-green-600'},
                {label:'Decline', status:'cancelled', className:'bg-red-500'}
            ];
        }
        if(status === 'confirmed'){
            return [
                {label:'Mark Completed', status:'completed', className:'bg-blue-500'},
                {label:'Cancel', status:'cancelled', className:'bg-red-500'}
            ];
        }
        return [];
    }

    if(status === 'pending' || status === 'confirmed'){
        return [{label:'Cancel Booking', status:'cancelled', className:'bg-red-500'}];
    }
    return [];
};

const BookingCard = ({booking, perspective, onUpdated}) => {
    const [isUpdating, setIsUpdating] = useState(false);

    const handleStatusChange = async (status) => {
        try{
            setIsUpdating(true);

            const res = await fetch(`/api/bookings/${booking._id}`,{
                method:'PUT',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({status})
            });

            const result = await res.json();

            if(res.status === 200){
                toast.success(`Booking ${status}`);
                onUpdated(result);
                return;
            }

            toast.error(result.message || 'Could not update this booking');
        }catch(error){
            console.log(error);
            toast.error('Could not update this booking');
        }finally{
            setIsUpdating(false);
        }
    };

    const actions = actionsFor(perspective, booking.status);
    const counterpart = perspective === 'request' ? booking.guest : booking.owner;

    // Only the guest pays, and only once the owner has accepted. A paid deposit
    // still gets a link, so the receipt stays reachable.
    const depositLink = (() => {
        if(perspective !== 'trip' || !booking.deposit?.amount){
            return null;
        }
        if(booking.deposit.status === 'paid'){
            return {label:'View Receipt', className:'bg-gray-600'};
        }
        if(booking.status === 'confirmed'){
            return {label:'Pay Deposit', className:'bg-blue-500'};
        }
        return null;
    })();

    return (
        <div className='relative bg-white p-4 rounded-md shadow-md border border-gray-200'>
            <div
                className={`absolute top-4 right-4 px-2 py-1 rounded-md text-sm capitalize ${STATUS_STYLES[booking.status]}`}
            >
                {booking.status}
            </div>

            <h2 className='text-xl font-bold mb-2 pr-24'>
                <Link href={`/properties/${booking.property?._id}`} className='hover:text-blue-500'>
                    {booking.property?.name || 'Property removed'}
                </Link>
            </h2>

            {booking.property?.location && (
                <p className='text-orange-700 text-sm flex items-center gap-2 mb-3'>
                    <FaMapMarker />
                    {booking.property.location.city} {booking.property.location.state}
                </p>
            )}

            <ul className='text-gray-700 space-y-1'>
                <li>
                    <strong>Dates:{' '}</strong>
                    {formatDate(booking.checkIn)} &rarr; {formatDate(booking.checkOut)}
                </li>
                <li className='flex items-center gap-2'>
                    <FaBed className='text-gray-500' />
                    {booking.days} day{booking.days > 1 ? 's' : ''}
                    <FaUserFriends className='text-gray-500 ml-2' />
                    {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                </li>
                <li>
                    <strong>Total:{' '}</strong>
                    {formatNPR(booking.totalPrice)}
                </li>
                {counterpart && (
                    <li>
                        <strong>{perspective === 'request' ? 'Guest' : 'Owner'}:{' '}</strong>
                        {counterpart.username}
                    </li>
                )}
                {booking.deposit?.amount > 0 && (
                    <li>
                        <strong>Deposit:{' '}</strong>
                        {formatNPR(booking.deposit.amount)}
                        <span
                            className={`ml-2 text-xs px-2 py-0.5 rounded ${DEPOSIT_STYLES[booking.deposit.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                            {DEPOSIT_LABELS[booking.deposit.status] ?? booking.deposit.status}
                        </span>
                    </li>
                )}
                {booking.note && (
                    <li><strong>Note:{' '}</strong>{booking.note}</li>
                )}
            </ul>

            {(actions.length > 0 || depositLink) && (
                <div className='mt-4 flex flex-wrap gap-3'>
                    {/* The deposit lives on the booking's own page, which is also
                        where the wallets drop the guest when they are done. */}
                    {depositLink && (
                        <Link
                            href={`/bookings/${booking._id}`}
                            className={`${depositLink.className} text-white py-1 px-3 rounded-md`}
                        >
                            {depositLink.label}
                        </Link>
                    )}
                    {actions.map((action) => (
                        <button
                            key={action.status}
                            onClick={() => handleStatusChange(action.status)}
                            disabled={isUpdating}
                            className={`${action.className} text-white py-1 px-3 rounded-md disabled:opacity-60`}
                        >
                            {action.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default BookingCard;
