'use client'
import{useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {PROPERTY_TYPES} from '@/lib/propertyTypes';

const PropertyFormSearch = () => {
    const [location, setLocation] = useState('');
    const [propertyType, setPropertyType] = useState('All');

    const router = useRouter();

    // On the results page this form sits above the results it produced, so it
    // starts out showing whatever the URL is currently searching for. Read after
    // mount rather than through useSearchParams, which would force every page
    // that renders this form behind a Suspense boundary.
    useEffect(()=>{
        const params = new URLSearchParams(window.location.search);
        setLocation(params.get('location') || '');
        setPropertyType(params.get('propertyType') || 'All');
    },[]);

    const handleSubmit  = (e)=>{
        e.preventDefault();

        // made the api to search the property based on location and property type
        if(location === '' && propertyType === 'All'){
            router.push('/properties');
            return;
        }

        // Merge into the current query string instead of replacing it, so the
        // price/beds/amenity filters survive a new keyword search.
        const params = new URLSearchParams(window.location.search);
        params.set('location',location);
        params.set('propertyType',propertyType);

        // a new search starts at the first page of results
        params.delete('page');

        router.push(`/properties/search-results?${params.toString()}`);
    }
    return (
        <form onSubmit={handleSubmit}
            className="mt-3 mx-auto max-w-2xl w-full flex flex-col md:flex-row items-center"
        >
            <div className="w-full md:w-3/5 md:pr-2 mb-4 md:mb-0">
                <label htmlFor="location" className="sr-only">Location</label>
                <input
                    type="text"
                    id="location"
                    placeholder="Enter Keywords or Location (City, State, Zip)"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring focus:ring-blue-500"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                />
            </div>
            <div className="w-full md:w-2/5 md:pl-2">
                <label htmlFor="property-type" className="sr-only">Property Type</label>
                <select
                    id="property-type"
                    className="w-full px-4 py-3 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring focus:ring-blue-500"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                >
                    <option value="All">All</option>
                    {PROPERTY_TYPES.map((option)=>(
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>
            <button
                type="submit"
                className="md:ml-4 mt-4 md:mt-0 w-full md:w-auto px-6 py-3 rounded-lg bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-500"
            >
                Search
            </button>
        </form>
    )
}

export default PropertyFormSearch;
