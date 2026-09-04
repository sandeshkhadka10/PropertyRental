'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { fetchProperty } from '@/utils/requests.js';
import PropertyHeaderImage from '@/components/PropertyHeaderImage';
import Link from 'next/link';
import PropertyDetails from '@/components/PropertyDetails';
import {FaArrowLeft} from 'react-icons/fa';
import Spinner from '@/components/Spinner';
import PropertyImages from '@/components/PropertyImages';
import BookMarkButton from '@/components/BookmarkButton';
import ShareButtons from '@/components/ShareButtons';
import PropertyContactForm from '@/components/PropertyContactForm';
import BookingForm from '@/components/BookingForm';
import PropertyReviews from '@/components/PropertyReviews';
import PropertyStatusBadge from '@/components/PropertyStatusBadge';

const PropertyPage = () => {
    const { id } = useParams();
    const [property, setProperty] = useState(null);

    // it is used to track whether the property data is still being fetched or not.
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPropertyData = async () => {
            if (!id) {
                return;
            }
            try {
                const property = await fetchProperty(id);
                setProperty(property);
            } catch (error) {
                console.error('Error fetching property: ', error);
            } finally {
                setLoading(false);
            }
        };
        if (property === null) {
            fetchPropertyData();
        }
    }, [id, property]);

    if (!property && !loading) {
        return (
            <h1 className='text-center text-2xl font-bold mt-10'>Property Not Found!</h1>
        )
    }

    return (
        <>
          {loading && <Spinner loading={loading}/>}
            {!loading && property && (
                <>
                    {/* For the header image */}
                    <PropertyHeaderImage image={property.images[0]} />

                    {/* Only the owner and admins can get this far on a listing
                        that is not live, so it is worth saying why. */}
                    {property.status && property.status !== 'approved' && (
                        <section>
                            <div className="container m-auto px-6 pt-6">
                                <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                                    <PropertyStatusBadge status={property.status} />
                                    <span className="text-sm text-amber-900">
                                        {property.status === 'pending'
                                            ? 'This listing is waiting for an admin to review it and is not visible to anyone else yet.'
                                            : 'This listing is hidden from the site.'}
                                        {property.moderation_note ? ` Reason: ${property.moderation_note}` : ''}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}


                    {/* Back to properties link */}
                    <section>
                        <div className="container m-auto py-5 px-6">
                            <Link
                                href="/properties"
                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-blue-500 hover:bg-gray-50 hover:text-blue-600"
                            >
                                <FaArrowLeft/> Back to Properties
                            </Link>
                        </div>
                    </section>

                    {/* Property Info */}
                    <section className="bg-blue-50">
                        <div className="container m-auto py-10 px-6">
                            {/* three equal columns rather than a 70%/30% pair: the
                                percentages plus the gap added up to more than the
                                row, which pushed the sidebar out of line */}
                            <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3">

                                <div className="lg:col-span-2">
                                    <PropertyDetails property={property}/>
                                    <PropertyReviews property={property}/>
                                </div>

                                {/* <!-- Sidebar --> */}
                                <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                                    <BookMarkButton property={property}/>
                                    <ShareButtons property={property}/>
                                    <BookingForm property={property}/>
                                    <PropertyContactForm property={property}/>
                                </aside>
                            </div>
                        </div>
                    </section>
                    <PropertyImages images={property.images}/>
                </>
            )}
        </>
    )
}
export default PropertyPage;