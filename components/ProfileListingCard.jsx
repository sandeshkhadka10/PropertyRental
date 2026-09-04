'use client';
import Image from 'next/image';
import Link from 'next/link';
import {
    FaBed,
    FaBath,
    FaRulerCombined,
    FaMapMarker,
    FaPen,
    FaTrash,
    FaRegImage
} from 'react-icons/fa';
import PropertyStatusBadge from '@/components/PropertyStatusBadge';
import PropertyAvailabilityBadge from '@/components/PropertyAvailabilityBadge';
import PropertyRating from '@/components/PropertyRating';
import {formatRateDisplay} from '@/utils/formatCurrency';

// One listing in the owner's own "Your Listings" grid. Everything a landlord
// needs to judge a listing at a glance - photo, price, where it stands with
// moderation, whether it is free - plus the two actions they came here for.
const ProfileListingCard = ({property, onDelete}) => {
    const cover = property.images?.[0];
    const rate = formatRateDisplay(property.rates);

    return (
        <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <Link
                href={`/properties/${property._id}`}
                className="relative block aspect-[16/10] overflow-hidden bg-gray-100"
            >
                {cover ? (
                    <Image
                        className="object-cover transition duration-300 group-hover:scale-[1.04]"
                        src={cover}
                        alt={property.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    />
                ) : (
                    /* a listing can be saved without a photo, and an empty
                       images array used to blow up this card */
                    <span className="flex h-full w-full items-center justify-center text-gray-400">
                        <FaRegImage className="h-8 w-8" />
                    </span>
                )}

                {rate && (
                    <span className="absolute bottom-2 left-2 rounded-lg bg-white/95 px-2.5 py-1 text-sm font-bold text-blue-700 shadow-sm dark:bg-gray-900/85 dark:text-blue-300">
                        {rate}
                    </span>
                )}
            </Link>

            <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2">
                    <PropertyStatusBadge status={property.status} />
                    <PropertyAvailabilityBadge availability={property.availability} />
                </div>

                <h3 className="mt-2 truncate text-lg font-bold text-gray-900" title={property.name}>
                    <Link href={`/properties/${property._id}`} className="hover:text-blue-600">
                        {property.name}
                    </Link>
                </h3>

                <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-orange-700">
                    <FaMapMarker className="shrink-0" />
                    <span className="truncate">
                        {property.location?.city} {property.location?.state}
                    </span>
                </p>

                <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><FaBed />{property.beds}</span>
                    <span className="flex items-center gap-1.5"><FaBath />{property.baths}</span>
                    <span className="flex items-center gap-1.5"><FaRulerCombined />{property.square_feet}</span>
                </div>

                <PropertyRating property={property} className="mt-2" />

                {property.status === 'pending' && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200">
                        Waiting for an admin to review it. Only you can see it until then.
                    </p>
                )}

                {property.moderation_note && (
                    <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
                        <span className="font-semibold">
                            {property.status === 'flagged' ? 'Taken down: ' : 'Rejected: '}
                        </span>
                        {property.moderation_note}
                    </p>
                )}

                {/* mt-auto pins the actions to the bottom so every card in a row
                    lines up however tall its moderation note happens to be */}
                <div className="mt-auto flex items-center gap-2 pt-4">
                    <Link
                        href={`/properties/${property._id}/edit`}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                        <FaPen className="h-3 w-3" />
                        Edit
                    </Link>
                    <button
                        type="button"
                        onClick={() => onDelete(property)}
                        aria-label={`Delete ${property.name}`}
                        className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                    >
                        <FaTrash className="h-3 w-3" />
                        Delete
                    </button>
                </div>
            </div>
        </article>
    );
};

export default ProfileListingCard;
