'use client';
import { useState } from 'react';
import { FaStar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { reviewSchema } from '@/lib/reviewSchema';

const formatStayDates = (booking) => {
    const checkIn = new Date(booking.checkIn).toLocaleDateString();
    const checkOut = new Date(booking.checkOut).toLocaleDateString();
    return `${checkIn} - ${checkOut}`;
};

// Shown only to a guest who has a finished stay that they have not written up
// yet. The stay is picked here rather than on the server, because someone who
// has stayed twice gets one review per visit.
const ReviewForm = ({ reviewableBookings, onReviewAdded }) => {
    const [bookingId, setBookingId] = useState(reviewableBookings[0]._id);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const clearError = (field) => {
        setErrors((previous) => {
            const next = { ...previous };
            delete next[field];
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const parsed = reviewSchema.safeParse({ rating, title, body });
        if (!parsed.success) {
            const fieldErrors = {};
            parsed.error.issues.forEach((issue) => {
                fieldErrors[issue.path.join('.')] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setErrors({});
        setSubmitting(true);

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ booking: bookingId, ...parsed.data })
            });

            const result = await res.json();

            if (res.status === 201) {
                toast.success(result.message);
                setRating(0);
                setTitle('');
                setBody('');
                onReviewAdded();
            } else {
                toast.error(result.message || 'Could not save your review');
            }
        } catch (error) {
            console.log(error);
            toast.error('Could not save your review');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className='bg-blue-50 rounded-lg p-6 mb-8'>
            <h4 className='text-lg font-bold mb-4'>Write a review</h4>

            {/* only worth asking which stay when there is more than one */}
            {reviewableBookings.length > 1 && (
                <div className='mb-4'>
                    <label
                        className='block text-gray-700 text-sm font-bold mb-2'
                        htmlFor='booking'
                    >
                        Which stay?
                    </label>
                    <select
                        id='booking'
                        value={bookingId}
                        onChange={(e) => setBookingId(e.target.value)}
                        className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 focus:outline-none focus:shadow-outline'
                    >
                        {reviewableBookings.map((booking) => (
                            <option key={booking._id} value={booking._id}>
                                {formatStayDates(booking)}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            <div className='mb-4'>
                <span className='block text-gray-700 text-sm font-bold mb-2'>Rating:</span>
                <div className='flex items-center gap-1' onMouseLeave={() => setHoveredRating(0)}>
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type='button'
                            aria-label={`${value} ${value === 1 ? 'star' : 'stars'}`}
                            onClick={() => {
                                setRating(value);
                                clearError('rating');
                            }}
                            onMouseEnter={() => setHoveredRating(value)}
                            className='text-2xl focus:outline-none'
                        >
                            <FaStar
                                className={
                                    value <= (hoveredRating || rating)
                                        ? 'text-yellow-500'
                                        : 'text-gray-300'
                                }
                            />
                        </button>
                    ))}
                </div>
                {errors.rating && <p className='text-red-500 text-sm mt-1'>{errors.rating}</p>}
            </div>

            <div className='mb-4'>
                <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='title'>
                    Title:
                </label>
                <input
                    id='title'
                    type='text'
                    placeholder='Sum up your stay'
                    value={title}
                    onChange={(e) => {
                        setTitle(e.target.value);
                        clearError('title');
                    }}
                    className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline'
                />
                {errors.title && <p className='text-red-500 text-sm mt-1'>{errors.title}</p>}
            </div>

            <div className='mb-4'>
                <label className='block text-gray-700 text-sm font-bold mb-2' htmlFor='body'>
                    Your review:
                </label>
                <textarea
                    id='body'
                    placeholder='How was the place, the host, the neighbourhood?'
                    value={body}
                    onChange={(e) => {
                        setBody(e.target.value);
                        clearError('body');
                    }}
                    className='shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 h-32 focus:outline-none focus:shadow-outline'
                ></textarea>
                {errors.body && <p className='text-red-500 text-sm mt-1'>{errors.body}</p>}
            </div>

            <button
                type='submit'
                disabled={submitting}
                className='bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline'
            >
                {submitting ? 'Posting...' : 'Post Review'}
            </button>
        </form>
    );
};

export default ReviewForm;
