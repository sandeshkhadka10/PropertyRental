'use client';
import {useState, useEffect, useMemo, useCallback} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import {toast} from 'react-toastify';
import {FaCalendarCheck} from 'react-icons/fa';
import {bookingSchema} from '@/lib/bookingSchema';
import {
    calculateBookingPrice,
    calculateStayDays,
    toDateInputValue,
    todayUTC
} from '@/utils/bookingPricing';
import {isRangeAvailable} from '@/utils/bookingAvailability';
import {describeAvailability} from '@/utils/propertyAvailability';
import {formatNPR} from '@/utils/formatCurrency';

const BookingForm = ({property}) => {
    const {data:session} = useSession();
    const router = useRouter();

    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [guests, setGuests] = useState(1);
    const [note, setNote] = useState('');
    const [errors, setErrors] = useState({});
    const [bookedRanges, setBookedRanges] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = toDateInputValue(todayUTC());

    // The dates already taken on this listing, so a clash can be shown before
    // the guest bothers submitting. The server checks again either way.
    const loadAvailability = useCallback(async () => {
        try{
            const res = await fetch(`/api/bookings/availability?propertyId=${property._id}`);
            if(res.ok){
                const {bookedRanges} = await res.json();
                setBookedRanges(bookedRanges);
            }
        }catch(error){
            console.log('Error fetching availability: ', error);
        }
    }, [property._id]);

    useEffect(() => {
        loadAvailability();
    }, [loadAvailability]);

    const days = useMemo(() => calculateStayDays(checkIn, checkOut), [checkIn, checkOut]);

    // Same function the API prices with, so the quote shown here is the quote charged.
    const quote = useMemo(
        () => calculateBookingPrice(property.rates, days),
        [property.rates, days]
    );

    const hasClash = useMemo(
        () => days > 0 && !isRangeAvailable(checkIn, checkOut, bookedRanges),
        [checkIn, checkOut, days, bookedRanges]
    );

    const handleChange = (field, value) => {
        if(field === 'checkIn'){
            setCheckIn(value);
            // a check-out before the new check-in can no longer be meant
            if(checkOut && value && checkOut <= value){
                setCheckOut('');
            }
        }else if(field === 'checkOut'){
            setCheckOut(value);
        }else if(field === 'guests'){
            setGuests(value);
        }else if(field === 'note'){
            setNote(value);
        }

        setErrors((prevErrors) => {
            const newErrors = {...prevErrors};
            delete newErrors[field];
            return newErrors;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const data = {
            property:property._id,
            checkIn,
            checkOut,
            guests,
            note
        };

        const parsed = bookingSchema.safeParse(data);
        if(!parsed.success){
            const fieldErrors = {};
            parsed.error.issues.forEach((issue) => {
                fieldErrors[issue.path.join('.')] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        if(hasClash){
            setErrors({checkOut:'Those dates are already booked'});
            return;
        }

        try{
            setIsSubmitting(true);

            const res = await fetch('/api/bookings',{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify(data)
            });

            const result = await res.json();

            if(res.status === 201){
                toast.success('Booking requested. The owner will confirm it shortly.');
                setCheckIn('');
                setCheckOut('');
                setGuests(1);
                setNote('');
                router.push('/bookings');
                return;
            }

            toast.error(result.message || 'Could not request this booking');

            // someone else took the dates while this form was open
            if(res.status === 409){
                loadAvailability();
            }
        }catch(error){
            console.log(error);
            toast.error('Could not request this booking');
        }finally{
            setIsSubmitting(false);
        }
    };

    const isOwnListing = session?.user?.id === property.owner;

    // Said up front rather than only after a clash: a place that is already
    // rented can still be requested for later dates, and it saves the guest
    // guessing which ones those are.
    const availability = describeAvailability(property.availability);
    const isTaken = availability && availability.state !== 'available';

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-bold mb-6">Book this property</h3>

            {isTaken && (
                <p className={`text-sm rounded-md border p-3 mb-4 ${availability.className}`}>
                    {availability.note}
                </p>
            )}

            {!session ? (
                <p>You must be logged in to book this property</p>
            ) : isOwnListing ? (
                <p className='text-gray-600'>This is your own listing, so you cannot book it.</p>
            ) : !property.rates?.daily ? (
                <p className='text-gray-600'>This property has no day rate set yet.</p>
            ) : (
                <form onSubmit={handleSubmit}>
                    <div className='mb-4'>
                        <label
                            className='block text-gray-700 text-sm font-bold mb-2'
                            htmlFor='checkIn'
                        >
                            Check In:
                        </label>
                        <input
                            className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                            id='checkIn'
                            type='date'
                            min={today}
                            value={checkIn}
                            onChange={(e) => handleChange('checkIn', e.target.value)}
                        />
                        {errors.checkIn && <p className='text-red-500 text-sm mt-1'>{errors.checkIn}</p>}
                    </div>

                    <div className='mb-4'>
                        <label
                            className='block text-gray-700 text-sm font-bold mb-2'
                            htmlFor='checkOut'
                        >
                            Check Out:
                        </label>
                        <input
                            className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                            id='checkOut'
                            type='date'
                            min={checkIn || today}
                            value={checkOut}
                            onChange={(e) => handleChange('checkOut', e.target.value)}
                        />
                        {errors.checkOut && <p className='text-red-500 text-sm mt-1'>{errors.checkOut}</p>}
                    </div>

                    <div className='mb-4'>
                        <label
                            className='block text-gray-700 text-sm font-bold mb-2'
                            htmlFor='guests'
                        >
                            Guests:
                        </label>
                        <input
                            className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                            id='guests'
                            type='number'
                            min='1'
                            value={guests}
                            onChange={(e) => handleChange('guests', e.target.value)}
                        />
                        {errors.guests && <p className='text-red-500 text-sm mt-1'>{errors.guests}</p>}
                    </div>

                    <div className='mb-4'>
                        <label
                            className='block text-gray-700 text-sm font-bold mb-2'
                            htmlFor='note'
                        >
                            Message to owner (optional):
                        </label>
                        <textarea
                            className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-24 focus:outline-none focus:shadow-outline'
                            id='note'
                            placeholder='Anything the owner should know'
                            value={note}
                            onChange={(e) => handleChange('note', e.target.value)}
                        ></textarea>
                        {errors.note && <p className='text-red-500 text-sm mt-1'>{errors.note}</p>}
                    </div>

                    {hasClash && (
                        <p className='bg-red-100 text-red-700 text-sm rounded-md p-3 mb-4'>
                            Those dates are already booked. Please pick another range.
                        </p>
                    )}

                    {/* the live quote: the owner's day rate for every day of the stay */}
                    {quote && !hasClash && (
                        <div className='bg-blue-50 rounded-md p-4 mb-4 text-sm'>
                            <p className='font-bold mb-2'>
                                {quote.days} day{quote.days > 1 ? 's' : ''} of stay
                            </p>
                            <div className='flex justify-between text-gray-700'>
                                <span>
                                    {formatNPR(property.rates.daily)} x {quote.days} day
                                    {quote.days > 1 ? 's' : ''}
                                </span>
                                <span>{formatNPR(quote.totalPrice)}</span>
                            </div>
                            <div className='flex justify-between font-bold border-t border-blue-200 mt-2 pt-2'>
                                <span>Total</span>
                                <span>{formatNPR(quote.totalPrice)}</span>
                            </div>
                            <p className='text-gray-500 text-xs mt-2'>
                                Check out by 12:00 on your last day.
                            </p>
                        </div>
                    )}

                    <button
                        className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline flex items-center justify-center disabled:opacity-60'
                        type='submit'
                        disabled={isSubmitting || hasClash}
                    >
                        <FaCalendarCheck className='mr-2' />
                        {isSubmitting ? 'Requesting...' : 'Request Booking'}
                    </button>
                </form>
            )}
        </div>
    )
}

export default BookingForm;
