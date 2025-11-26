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
                    
                    {/* Back to properties link */}
                    <section>
                        <div className="container m-auto py-6 px-6">
                            <Link
                                href="/properties"
                                className="text-blue-500 hover:text-blue-600 flex items-center"
                            >
                                <FaArrowLeft className='mr-2'/> Back to Properties
                            </Link>
                        </div>
                    </section>

                    {/* Property Info */}
                    <section className="bg-blue-50">
                        <div className="container m-auto py-10 px-6">
                            <div className="grid grid-cols-1 md:grid-cols-[70%_30%] w-full gap-6">

                                <PropertyDetails property={property}/>

                                {/* <!-- Sidebar --> */}
                                <aside className="space-y-4">
                                    <BookMarkButton property={property}/>
                                    <ShareButtons property={property}/>
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