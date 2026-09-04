'use client';
import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FaArrowAltCircleLeft } from 'react-icons/fa';
import PropertyCard from '@/components/PropertyCard';
import Spinner from '@/components/Spinner';
import PropertyFormSearch from '@/components/PropertyFormSearch';
import PropertySearchFilters from '@/components/PropertySearchFilters';
import Pagination from '@/components/Pagination';

const PAGE_SIZE = 9;

// Everything the API understands. Whatever is in the URL is forwarded as-is,
// which keeps a filtered search shareable and survives a refresh.
const SEARCH_PARAM_KEYS = [
    'location',
    'propertyType',
    'minPrice',
    'maxPrice',
    'minBeds',
    'minBaths',
    'amenities',
    'sort',
    'lat',
    'lng',
    'radius'
];

const SearchResults = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [properties, setProperties] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const page = Math.max(Number(searchParams.get('page')) || 1, 1);

    // A primitive key, so the effect re-runs on any filter change without
    // depending on the searchParams object identity.
    const queryString = (() => {
        const params = new URLSearchParams();
        SEARCH_PARAM_KEYS.forEach((key) => {
            const value = searchParams.get(key);
            if (value) {
                params.set(key, value);
            }
        });
        params.set('page', String(page));
        params.set('pageSize', String(PAGE_SIZE));
        return params.toString();
    })();

    useEffect(() => {
        let cancelled = false;

        const fetchSearchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/properties/search?${queryString}`);
                if (cancelled) {
                    return;
                }
                if (res.ok) {
                    const data = await res.json();
                    setProperties(data.properties || []);
                    setTotal(data.total || 0);
                } else {
                    setProperties([]);
                    setTotal(0);
                }
            } catch (error) {
                console.log(error);
                if (!cancelled) {
                    setProperties([]);
                    setTotal(0);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchSearchResults();

        // stops a slow earlier request from overwriting newer results
        return () => {
            cancelled = true;
        };
    }, [queryString]);

    const handlePageChange = (newPage) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(newPage));
        router.push(`/properties/search-results?${params.toString()}`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <>
            {/* Displaying Search Box All Time  */}
            <section className='bg-blue-700 py-4'>
                <div className='max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8'>
                    <PropertyFormSearch />
                </div>
            </section>

            <section className='px-4 py-6'>
                <div className='container-xl lg:container m-auto px-4 py-6'>
                    <Link href='/properties' className='flex items-center text-blue-500 hover:underline mb-3'>
                        <FaArrowAltCircleLeft className='mr-2' />
                        Back to properties
                    </Link>

                    <div className='flex flex-wrap items-baseline justify-between gap-2 mb-4'>
                        <h1 className='text-2xl'>Search Results</h1>
                        {!loading && (
                            <p className='text-gray-600 text-sm'>
                                {total} {total === 1 ? 'property' : 'properties'} found
                            </p>
                        )}
                    </div>

                    <PropertySearchFilters />

                    {loading ? (
                        <Spinner loading={loading} />
                    ) : properties.length === 0 ? (
                        <p>No search results found</p>
                    ) : (
                        <>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                                {properties.map((property) => (
                                    <PropertyCard key={property._id} property={property} />
                                ))}
                            </div>
                            {total > PAGE_SIZE && (
                                <Pagination
                                    page={page}
                                    pageSize={PAGE_SIZE}
                                    totalItems={total}
                                    onPageChange={handlePageChange}
                                />
                            )}
                        </>
                    )}
                </div>
            </section>
        </>
    );
};

// useSearchParams needs a Suspense boundary above it for the build to prerender
// this route.
const SearchResultPage = () => (
    <Suspense fallback={<Spinner loading={true} />}>
        <SearchResults />
    </Suspense>
);

export default SearchResultPage;
