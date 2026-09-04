import Image from "next/image";
import Link from "next/link";
import {FaBed, FaBath, FaRulerCombined, FaMapMarker} from 'react-icons/fa';
import PropertyRating from '@/components/PropertyRating';
import PropertyAvailabilityBadge from '@/components/PropertyAvailabilityBadge';
import {formatRateDisplay} from '@/utils/formatCurrency';

const PropertyCard = ({ property }) => {
    return (
        <div className="rounded-xl shadow-md relative overflow-hidden">
            {/* a fixed aspect ratio keeps every card in the grid the same
                height, whatever shape the uploaded photo happens to be */}
            <div className="relative aspect-[4/3]">
                <Image
                    src={property.images[0]}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className='object-cover'
                />
            </div>
            {/* nothing is drawn for a free listing, so the corner stays clear */}
            <PropertyAvailabilityBadge
                availability={property.availability}
                className="absolute top-[10px] left-[10px] shadow-sm"
            />
            <h3
                className="absolute top-[10px] right-[10px] bg-white px-3 py-1 rounded-lg text-blue-500 font-bold text-sm"
            >
                {formatRateDisplay(property.rates)}
            </h3>

            <div className="p-4">
                <div className="text-gray-600 text-sm">{property.type}</div>
                <h3 className="text-lg font-bold truncate">{property.name}</h3>
                <PropertyRating property={property} className="mt-1" />

                <div className="flex items-center gap-4 text-gray-500 text-sm mt-3">
                    <span><FaBed className="inline mr-1"></FaBed>{property.beds}</span>
                    <span><FaBath className="inline mr-1"></FaBath>{property.baths}</span>
                    <span><FaRulerCombined className="inline mr-1"></FaRulerCombined>{property.square_feet}</span>
                </div>

                <div className="flex items-center justify-between gap-2 mt-3">
                    <span className="flex items-center gap-1 text-orange-700 text-sm min-w-0">
                        <FaMapMarker className="shrink-0"></FaMapMarker>
                        <span className="truncate">{property.location.city} {property.location.state}</span>
                        {/* only present on a "near me" search, which is the one
                            place the API returns a distance */}
                        {typeof property.distance === 'number' && (
                            <span className="text-gray-500 whitespace-nowrap">
                                · {property.distance} km
                            </span>
                        )}
                    </span>
                    <Link
                        href={`/properties/${property._id}`}
                        className="shrink-0 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-center text-sm"
                    >
                        Details
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default PropertyCard;
