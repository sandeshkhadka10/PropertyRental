import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

// Read-only star display, shared by the property cards, the reviews list and
// the ratings summary. Rounds to the nearest half star: 4.2 shows as 4 stars,
// 4.3 shows as four and a half.
const StarRating = ({ rating = 0, size = 'text-sm', className = '' }) => {
    const rounded = Math.round(Number(rating) * 2) / 2;

    return (
        <span
            className={`inline-flex items-center gap-0.5 text-yellow-500 ${size} ${className}`}
            // the numeric score sits next to this in every caller, so the stars
            // themselves are decoration as far as a screen reader is concerned
            aria-hidden='true'
        >
            {[1, 2, 3, 4, 5].map((position) => {
                if (rounded >= position) {
                    return <FaStar key={position} />;
                }
                if (rounded >= position - 0.5) {
                    return <FaStarHalfAlt key={position} />;
                }
                return <FaRegStar key={position} className='text-gray-300' />;
            })}
        </span>
    );
};

export default StarRating;
