import StarRating from '@/components/StarRating';

// The compact rating line used on property cards. A listing with no reviews yet
// says so rather than showing an empty row of stars, which would otherwise read
// as a zero-star rating.
const PropertyRating = ({ property, className = '' }) => {
    const count = property?.rating_count || 0;

    if (count === 0) {
        return (
            <p className={`text-sm text-gray-500 ${className}`}>No reviews yet</p>
        );
    }

    const average = Number(property.rating_avg || 0);

    return (
        <p className={`flex items-center gap-2 text-sm ${className}`}>
            <StarRating rating={average} />
            <span className='font-semibold text-gray-800'>{average.toFixed(1)}</span>
            <span className='text-gray-500'>
                ({count} {count === 1 ? 'review' : 'reviews'})
            </span>
        </p>
    );
};

export default PropertyRating;
