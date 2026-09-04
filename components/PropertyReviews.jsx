'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import profileDefault from '@/assets/images/profile.png';
import StarRating from '@/components/StarRating';
import ReviewForm from '@/components/ReviewForm';
import Spinner from '@/components/Spinner';

const PropertyReviews = ({ property }) => {
    const { data: session } = useSession();

    const [reviews, setReviews] = useState([]);
    const [reviewableBookings, setReviewableBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const propertyId = property._id;

    // The summary is worked out from the reviews on screen rather than from
    // property.rating_avg, so the header still matches the list after someone
    // posts a review without the whole page being refetched.
    const count = reviews.length;
    const average = count === 0
        ? 0
        : reviews.reduce((sum, review) => sum + review.rating, 0) / count;

    const loadReviews = useCallback(async () => {
        try {
            const res = await fetch(`/api/properties/${propertyId}/reviews`);
            if (res.ok) {
                setReviews(await res.json());
            }
        } catch (error) {
            console.log(error);
        }
    }, [propertyId]);

    // Which of this visitor's stays still need writing up. Signed-out visitors
    // get an empty list back, so there is no need to branch on the session here.
    const loadEligibility = useCallback(async () => {
        try {
            const res = await fetch(`/api/reviews/eligibility?propertyId=${propertyId}`);
            if (res.ok) {
                const data = await res.json();
                setReviewableBookings(data.reviewableBookings);
            }
        } catch (error) {
            console.log(error);
        }
    }, [propertyId]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([loadReviews(), loadEligibility()]);
            setLoading(false);
        };
        load();
    }, [loadReviews, loadEligibility]);

    // after posting, both lists move: a new review appears and the stay it was
    // written against drops out of the eligible set
    const handleReviewAdded = () => {
        loadReviews();
        loadEligibility();
    };

    return (
        <section className='bg-white p-6 sm:p-8 rounded-xl shadow-md mt-6'>
            <div className='flex flex-wrap items-center justify-between gap-2 mb-6'>
                <h3 className='text-xl font-bold text-gray-900'>Reviews</h3>
                {count > 0 && (
                    <p className='flex items-center gap-2'>
                        <StarRating rating={average} size='text-base' />
                        <span className='font-bold text-gray-800'>{average.toFixed(1)}</span>
                        <span className='text-gray-500'>
                            ({count} {count === 1 ? 'review' : 'reviews'})
                        </span>
                    </p>
                )}
            </div>

            {loading ? (
                <Spinner loading={loading} />
            ) : (
                <>
                    {reviewableBookings.length > 0 && (
                        <ReviewForm
                            reviewableBookings={reviewableBookings}
                            onReviewAdded={handleReviewAdded}
                        />
                    )}

                    {/* Explains the empty state to the people who could act on it:
                        a signed-in visitor with no finished stay here. */}
                    {session && reviewableBookings.length === 0 && (
                        <p className='text-gray-500 text-sm mb-6'>
                            Only guests who have completed a stay here can leave a review.
                        </p>
                    )}

                    {count === 0 ? (
                        <p className='text-gray-500'>No reviews yet.</p>
                    ) : (
                        <ul className='space-y-6'>
                            {reviews.map((review) => (
                                <li key={review._id} className='border-b border-gray-100 pb-6 last:border-0 last:pb-0'>
                                    <div className='flex items-center gap-3 mb-2'>
                                        <Image
                                            className='h-10 w-10 rounded-full object-cover'
                                            src={review.author?.image || profileDefault}
                                            alt=''
                                            width={40}
                                            height={40}
                                        />
                                        <div>
                                            <p className='font-semibold'>
                                                {review.author?.username || 'Guest'}
                                            </p>
                                            <p className='text-gray-500 text-xs'>
                                                Stayed {new Date(review.booking?.checkIn).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <p className='flex items-center gap-2 mb-1'>
                                        <StarRating rating={review.rating} />
                                        <span className='sr-only'>{review.rating} out of 5</span>
                                        {review.title && (
                                            <span className='font-semibold'>{review.title}</span>
                                        )}
                                    </p>

                                    <p className='text-gray-700'>{review.body}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </>
            )}
        </section>
    );
};

export default PropertyReviews;
