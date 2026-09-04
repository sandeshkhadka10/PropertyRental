import {
    FaBed,
    FaBath,
    FaRulerCombined,
    FaCheck,
    FaMapMarkerAlt,
    FaRegClock
} from 'react-icons/fa';
import PropertyMap from '@/components/PropertyMap';
import PropertyAvailabilityBadge from '@/components/PropertyAvailabilityBadge';
import PropertyRating from '@/components/PropertyRating';
import {formatNPR, toAmount} from '@/utils/formatCurrency';
import {describeAvailability} from '@/utils/propertyAvailability';

// Every block on this page is the same card, so the shell is written once.
const CARD = 'bg-white rounded-xl shadow-md p-6 sm:p-8';

// One of the three headline numbers under the rate.
const Fact = ({icon: Icon, value, label}) => (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Icon />
        </span>
        <span className="min-w-0">
            <span className="block text-lg font-bold leading-tight text-gray-900">{value}</span>
            <span className="block text-xs uppercase tracking-wide text-gray-500">{label}</span>
        </span>
    </div>
);

const PropertyDetails = ({ property }) => {
    // spelt out in full here, unlike the cards, since this is the page someone
    // reads before deciding whether it is worth asking for dates
    const availability = describeAvailability(property.availability);

    // A stay is charged by the day, so there is only ever the one rate.
    const dailyRate = toAmount(property.rates?.daily);

    const address = [property.location?.city, property.location?.state]
        .filter(Boolean)
        .join(', ');

    const amenities = property.amenities || [];

    return (
        <main className="space-y-6">
            <section className={CARD}>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                        {property.type}
                    </span>
                    <PropertyAvailabilityBadge
                        availability={property.availability}
                        showAvailable={true}
                    />
                </div>

                <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {property.name}
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
                    {address && (
                        <a
                            href="#map"
                            className="flex items-center gap-2 text-orange-700 hover:underline"
                        >
                            <FaMapMarkerAlt className="shrink-0" />
                            <span>{address}</span>
                        </a>
                    )}
                    <PropertyRating property={property} />
                </div>

                {/* the badge above says which state the listing is in, this says
                    what that means for the dates someone is about to ask for */}
                {availability && (
                    <p className={`mt-5 rounded-xl border px-4 py-3 text-sm ${availability.className}`}>
                        {availability.note}
                    </p>
                )}

                <div className="mt-5 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                            Rate
                        </p>
                        {dailyRate === null ? (
                            <p className="mt-1 text-lg font-semibold text-gray-500">
                                No rate set yet
                            </p>
                        ) : (
                            <p className="mt-1 flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-blue-700">
                                    {formatNPR(dailyRate)}
                                </span>
                                <span className="text-sm font-medium text-gray-600">/ day</span>
                            </p>
                        )}
                    </div>
                    <p className="flex items-center gap-2 text-xs text-gray-600">
                        <FaRegClock className="shrink-0" />
                        Charged for each day of the stay, check out by 12:00 on your last day.
                    </p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Fact
                        icon={FaBed}
                        value={property.beds}
                        label={property.beds === 1 ? 'Bedroom' : 'Bedrooms'}
                    />
                    <Fact
                        icon={FaBath}
                        value={property.baths}
                        label={property.baths === 1 ? 'Bathroom' : 'Bathrooms'}
                    />
                    <Fact
                        icon={FaRulerCombined}
                        value={Number(property.square_feet).toLocaleString('en-IN')}
                        label="Sq ft"
                    />
                </div>
            </section>

            <section className={CARD}>
                <h2 className="text-xl font-bold text-gray-900">About this property</h2>
                {property.description ? (
                    // whitespace-pre-line so the paragraph breaks the owner typed
                    // into the form survive onto the page
                    <p className="mt-4 whitespace-pre-line leading-relaxed text-gray-700">
                        {property.description}
                    </p>
                ) : (
                    <p className="mt-4 text-gray-500">
                        The owner has not written a description for this listing yet.
                    </p>
                )}
            </section>

            <section className={CARD}>
                <h2 className="text-xl font-bold text-gray-900">
                    Amenities
                    {amenities.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            ({amenities.length})
                        </span>
                    )}
                </h2>

                {amenities.length === 0 ? (
                    <p className="mt-4 text-gray-500">No amenities listed for this property.</p>
                ) : (
                    <ul className="mt-4 grid list-none grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {amenities.map((amenity, index) => (
                            <li
                                key={index}
                                className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700"
                            >
                                <FaCheck className="mt-1 shrink-0 text-green-600" />
                                <span>{amenity}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <section className={CARD} id="map">
                <h2 className="text-xl font-bold text-gray-900">Where you&apos;ll be</h2>
                {address && <p className="mt-1 text-gray-500">{address}</p>}
                <div className="mt-4 overflow-hidden rounded-xl border border-gray-200">
                    <PropertyMap property={property} />
                </div>
            </section>
        </main>
    )
}

export default PropertyDetails
