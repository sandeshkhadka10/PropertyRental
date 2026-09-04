'use client';
import {useState, useEffect} from 'react';
import Spinner from '@/components/Spinner';
import BookingCard from '@/components/BookingCard';

const Bookings = () => {
    // trips  -> stays this user booked somewhere else
    // requests -> bookings other people made on this user's own listings
    const [trips, setTrips] = useState([]);
    const [requests, setRequests] = useState([]);
    const [tab, setTab] = useState('trips');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getBookings = async () => {
            try{
                const res = await fetch('/api/bookings');
                if(res.status === 200){
                    const data = await res.json();
                    setTrips(data.trips);
                    setRequests(data.requests);
                }
            }catch(error){
                console.log('Error fetching bookings: ', error);
            }finally{
                setLoading(false);
            }
        }
        getBookings();
    }, []);

    // swap the updated booking in place so the list does not have to be refetched
    const handleUpdated = (updated) => {
        const replace = (bookings) => bookings.map((booking) => (
            booking._id === updated._id ? {...booking, status:updated.status} : booking
        ));

        setTrips(replace);
        setRequests(replace);
    };

    const isTrips = tab === 'trips';
    const shown = isTrips ? trips : requests;

    const tabClass = (active) =>
        `px-4 py-2 rounded-md font-medium ${active ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'}`;

    return loading ? (<Spinner loading={loading} />)
        :
        (
            <section className="bg-blue-50">
                <div className="container m-auto py-24 max-w-6xl">
                    <div
                        className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
                    >
                        <h1 className="text-3xl font-bold mb-4">Your Bookings</h1>

                        <div className='flex gap-3 mb-6'>
                            <button onClick={() => setTab('trips')} className={tabClass(isTrips)}>
                                My Trips ({trips.length})
                            </button>
                            <button onClick={() => setTab('requests')} className={tabClass(!isTrips)}>
                                Requests On My Listings ({requests.length})
                            </button>
                        </div>

                        <div className="space-y-4">
                            {shown.length === 0 ?
                                (
                                    <p>
                                        {isTrips
                                            ? 'You have not booked any property yet'
                                            : 'No one has requested a booking on your listings yet'}
                                    </p>
                                )
                                :
                                (
                                    shown.map((booking) => (
                                        <BookingCard
                                            key={booking._id}
                                            booking={booking}
                                            perspective={isTrips ? 'trip' : 'request'}
                                            onUpdated={handleUpdated}
                                        />
                                    ))
                                )
                            }
                        </div>
                    </div>
                </div>
            </section>
        )

}

export default Bookings;
