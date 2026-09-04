import {describeAvailability} from '@/utils/propertyAvailability';

/**
 * "Rented until 12 Oct 2026" / "Booked from 3 Nov 2026" on a listing.
 *
 * A free listing shows nothing by default: a green badge on every card would
 * be noise, and the absence of a badge already reads as available. Pass
 * `showAvailable` where the reassurance is worth the room, like the details page.
 */
const PropertyAvailabilityBadge = ({availability, showAvailable = false, className = ''})=>{
    const style = describeAvailability(availability);

    if(!style || (style.state === 'available' && !showAvailable)){
        return null;
    }

    return (
        <span
            title={style.note}
            className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold ${style.className} ${className}`}
        >
            {style.short}
        </span>
    );
};

export default PropertyAvailabilityBadge;
