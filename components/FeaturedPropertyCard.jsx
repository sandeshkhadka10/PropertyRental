import Link from 'next/link';
import {
    FaBed,
    FaBath,
    FaRulerCombined,
    FaMapMarker
} from 'react-icons/fa';
import Image from 'next/image';
import PropertyRating from '@/components/PropertyRating';
import PropertyAvailabilityBadge from '@/components/PropertyAvailabilityBadge';
import {formatRateDisplay} from '@/utils/formatCurrency';

const FeaturedPropertyCard = ({ property }) => {
    return (
        <div
            className="bg-white rounded-xl shadow-md relative flex flex-col md:flex-row"
        >
            <Image
                src={property.images[0]}
                alt=""
                width={0}
                height={0}
                sizes='100vw'
                className="object-cover rounded-t-xl md:rounded-tr-none md:rounded-l-xl w-full md:w-2/5"
            />
            {/* the rate sits top left on this card, so this goes opposite it */}
            <PropertyAvailabilityBadge
                availability={property.availability}
                className="absolute top-[10px] right-[10px] shadow-sm"
            />
            <div className="p-6">
                <h3 className="text-xl font-bold">{property.name}</h3>
                <div className="text-gray-600">{property.type}</div>
                <PropertyRating property={property} className="mb-4 mt-1" />
                <h3
                    className="absolute top-[10px] left-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right"
                >
                    {formatRateDisplay(property.rates)}
                </h3>
                <div className="flex justify-center gap-4 text-gray-500 mb-4">
                    <p>
                        <FaBed className='inline-block mr-2' /> {property.beds}{' '}
                        <span className="md:hidden lg:inline">Beds</span>
                    </p>
                    <p>
                        <FaBath className='inline-block mr-2' /> {property.baths}{' '}
                        <span className="md:hidden lg:inline">Baths</span>
                    </p>
                    <p>
                        <FaRulerCombined className='inline-block mr-2' />
                        {property.square_feet}{' '} <span className="md:hidden lg:inline">sqft</span>
                    </p>
                </div>

                <div className="border border-gray-200 mb-5"></div>

                <div className="flex flex-col lg:flex-row justify-between">
                    <div className="flex align-middle gap-2 mb-4 lg:mb-0">
                        <FaMapMarker className='text-orange-700 mt-1'/>
                        <span className="text-orange-700"> {property.location.city} {property.location.state} </span>
                    </div>
                    <Link
                        href={`/properties/${property._id}`}
                        className="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                    >
                        Details
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default FeaturedPropertyCard;