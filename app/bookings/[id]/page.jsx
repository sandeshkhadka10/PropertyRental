'use client';
import {Suspense, useEffect, useState} from 'react';
import {useParams} from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {FaArrowLeft, FaMapMarker, FaCalendarAlt, FaUserFriends} from 'react-icons/fa';
import Spinner from '@/components/Spinner';
import BookingDepositPanel from '@/components/BookingDepositPanel';
import PaymentResultBanner from '@/components/PaymentResultBanner';
import {formatNPR} from '@/utils/formatCurrency';
import {UNIT_LABELS} from '@/utils/bookingPricing';

const STATUS_STYLES = {
    pending:'bg-yellow-100 text-yellow-800',
    confirmed:'bg-green-100 text-green-800',
    completed:'bg-blue-100 text-blue-800',
    cancelled:'bg-gray-200 text-gray-700'
};

const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-GB',{
        day:'numeric',
        month:'short',
        year:'numeric',
        timeZone:'UTC'
    });

const BookingPage = () => {
    const {id} = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBooking = async () => {
            try{
                const res = await fetch(`/api/bookings/${id}`);
                if(!res.ok){
                    return;
                }
                setBooking(await res.json());
            }catch(error){
                console.log(error);
            }finally{
                setLoading(false);
            }
        };
        if(id){
            fetchBooking();
        }
    },[id]);

    if(loading){
        return <Spinner loading={loading}/>;
    }

    if(!booking){
        return (
            <h1 className='text-center text-2xl font-bold mt-10'>Booking Not Found!</h1>
        );
    }

    const {property} = booking;

    return (
        <section className='bg-blue-50 min-h-screen'>
            <div className='container m-auto py-10 px-6'>
                <Link
                    href='/properties'
                    className='text-blue-500 hover:text-blue-600 flex items-center mb-6'
                >
                    <FaArrowLeft className='mr-2'/> Back to Properties
                </Link>

                {/* Rendered by the gateway redirect, so it reads ?payment= from the URL */}
                <Suspense fallback={null}>
                    <PaymentResultBanner/>
                </Suspense>

                <div className='grid grid-cols-1 md:grid-cols-[65%_35%] gap-6'>
                    <main className='bg-white p-6 rounded-lg shadow-md'>
                        <div className='flex items-start justify-between gap-4 mb-4'>
                            <div>
                                <h1 className='text-2xl font-bold'>{property?.name}</h1>
                                <p className='text-orange-700 flex items-center mt-1'>
                                    <FaMapMarker className='mr-2'/>
                                    {property?.location?.city} {property?.location?.state}
                                </p>
                            </div>
                            <span
                                className={`text-xs font-bold uppercase tracking-wide rounded-full px-3 py-1 ${
                                    STATUS_STYLES[booking.status] ?? 'bg-gray-100 text-gray-700'
                                }`}
                            >
                                {booking.status}
                            </span>
                        </div>

                        {property?.images?.[0] && (
                            <Image
                                src={property.images[0]}
                                alt=''
                                width={0}
                                height={0}
                                sizes='100vw'
                                className='w-full h-56 object-cover rounded-lg mb-6'
                            />
                        )}

                        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6'>
                            <div>
                                <div className='text-gray-500 text-sm flex items-center mb-1'>
                                    <FaCalendarAlt className='mr-2'/> Check in
                                </div>
                                <div className='font-bold'>{formatDate(booking.checkIn)}</div>
                            </div>
                            <div>
                                <div className='text-gray-500 text-sm flex items-center mb-1'>
                                    <FaCalendarAlt className='mr-2'/> Check out
                                </div>
                                <div className='font-bold'>{formatDate(booking.checkOut)}</div>
                            </div>
                            <div>
                                <div className='text-gray-500 text-sm flex items-center mb-1'>
                                    <FaUserFriends className='mr-2'/> Guests
                                </div>
                                <div className='font-bold'>{booking.guests}</div>
                            </div>
                        </div>

                        <h2 className='text-lg font-bold bg-gray-800 text-white p-2 mb-4'>
                            {booking.days} day{booking.days > 1 ? 's' : ''} of stay
                        </h2>

                        <ul className='divide-y divide-gray-200 mb-4'>
                            {booking.priceBreakdown?.map((line, index) => (
                                <li key={index} className='flex justify-between py-2'>
                                    <span className='text-gray-600'>
                                        {line.count} x {UNIT_LABELS[line.unit] ?? line.unit} at{' '}
                                        {formatNPR(line.rate)}
                                    </span>
                                    <span className='font-semibold'>{formatNPR(line.subtotal)}</span>
                                </li>
                            ))}
                        </ul>

                        <div className='flex justify-between border-t-2 border-gray-800 pt-3'>
                            <span className='font-bold'>Total</span>
                            <span className='text-xl font-bold text-blue-500'>
                                {formatNPR(booking.totalPrice)}
                            </span>
                        </div>

                        {booking.note && (
                            <p className='text-gray-500 text-sm mt-6 italic'>
                                Your note: {booking.note}
                            </p>
                        )}
                    </main>

                    <aside className='space-y-4'>
                        <BookingDepositPanel booking={booking}/>
                    </aside>
                </div>
            </div>
        </section>
    );
};

export default BookingPage;
