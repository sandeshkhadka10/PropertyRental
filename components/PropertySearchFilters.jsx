'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaLocationArrow, FaSlidersH } from 'react-icons/fa';

// Same values the add/edit forms write, so a ticked box actually matches data.
export const AMENITY_OPTIONS = [
    'Wifi',
    'Full Kitchen',
    'Washer & Dryer',
    'Free Parking',
    'Swimming Pool',
    'Hot Tub',
    '24/7 Security',
    'Wheelchair Accessible',
    'Elevator Access',
    'Dishwasher',
    'Gym/Fitness Center',
    'Air Conditioning',
    'Balcony/Patio',
    'Smart TV',
    'Coffee Maker'
];

// Must line up with SORT_OPTIONS in app/api/properties/search/route.js
const SORT_CHOICES = [
    { value: '', label: 'Best match' },
    { value: 'price_asc', label: 'Price: low to high' },
    { value: 'price_desc', label: 'Price: high to low' },
    { value: 'newest', label: 'Newest first' },
    { value: 'oldest', label: 'Oldest first' },
    { value: 'rating', label: 'Highest rated' },
    { value: 'distance', label: 'Nearest first' }
];

const RADIUS_CHOICES = [2, 5, 10, 25, 50, 100];

const MIN_CHOICES = [
    { value: '', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' }
];

// The keys this panel owns. `location` and `propertyType` belong to
// PropertyFormSearch and are carried through untouched.
const FILTER_KEYS = [
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

const readFilters = (searchParams) => ({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minBeds: searchParams.get('minBeds') || '',
    minBaths: searchParams.get('minBaths') || '',
    amenities: (searchParams.get('amenities') || '')
        .split(',')
        .map((amenity) => amenity.trim())
        .filter(Boolean),
    sort: searchParams.get('sort') || '',
    lat: searchParams.get('lat') || '',
    lng: searchParams.get('lng') || '',
    radius: searchParams.get('radius') || '10'
});

const PropertySearchFilters = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [open, setOpen] = useState(false);
    const [locating, setLocating] = useState(false);
    const [filters, setFilters] = useState(() => readFilters(searchParams));

    // Keep the controls in step when the URL changes from somewhere else,
    // such as the back button or a fresh keyword search.
    useEffect(() => {
        setFilters(readFilters(searchParams));
    }, [searchParams]);

    const activeCount = FILTER_KEYS.filter((key) => {
        if (key === 'radius') {
            return false; // only meaningful alongside lat/lng
        }
        if (key === 'amenities') {
            return filters.amenities.length > 0;
        }
        if (key === 'lng') {
            return false; // counted once, via lat
        }
        return filters[key] !== '';
    }).length;

    const setField = (key, value) => {
        setFilters((previous) => ({ ...previous, [key]: value }));
    };

    const toggleAmenity = (amenity) => {
        setFilters((previous) => ({
            ...previous,
            amenities: previous.amenities.includes(amenity)
                ? previous.amenities.filter((item) => item !== amenity)
                : [...previous.amenities, amenity]
        }));
    };

    const pushFilters = (next) => {
        const params = new URLSearchParams(searchParams.toString());

        FILTER_KEYS.forEach((key) => {
            const value = key === 'amenities' ? next.amenities.join(',') : next[key];
            if (value === '' || value === undefined || value === null) {
                params.delete(key);
            } else {
                params.set(key, value);
            }
        });

        // radius only travels with a coordinate pair
        if (!next.lat || !next.lng) {
            params.delete('radius');
            params.delete('lat');
            params.delete('lng');
        }

        // a changed filter set makes the old page number meaningless
        params.delete('page');

        router.push(`/properties/search-results?${params.toString()}`);
    };

    const handleApply = (e) => {
        e.preventDefault();

        const min = Number(filters.minPrice);
        const max = Number(filters.maxPrice);
        if (filters.minPrice !== '' && filters.maxPrice !== '' && min > max) {
            toast.error('Minimum price cannot be greater than the maximum');
            return;
        }

        pushFilters(filters);
    };

    const handleReset = () => {
        const cleared = {
            minPrice: '',
            maxPrice: '',
            minBeds: '',
            minBaths: '',
            amenities: [],
            sort: '',
            lat: '',
            lng: '',
            radius: '10'
        };
        setFilters(cleared);
        pushFilters(cleared);
    };

    const handleNearMe = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported in this browser');
            return;
        }

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const next = {
                    ...filters,
                    lat: String(latitude),
                    lng: String(longitude),
                    radius: filters.radius || '10',
                    sort: 'distance'
                };
                setFilters(next);
                pushFilters(next);
                setLocating(false);
            },
            (error) => {
                setLocating(false);
                if (error?.code === 1) {
                    toast.error('Location access denied. Please allow location permission in your browser.');
                    return;
                }
                toast.error('Unable to get your current location');
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
        );
    };

    const usingLocation = filters.lat !== '' && filters.lng !== '';

    return (
        <div className='bg-white rounded-xl shadow-md p-4 mb-6'>
            <div className='flex items-center justify-between gap-4'>
                <button
                    type='button'
                    onClick={() => setOpen((previous) => !previous)}
                    className='flex items-center gap-2 font-bold text-gray-800'
                >
                    <FaSlidersH className='text-blue-500' />
                    Filters
                    {activeCount > 0 && (
                        <span className='bg-blue-500 text-white text-xs rounded-full px-2 py-0.5'>
                            {activeCount}
                        </span>
                    )}
                </button>

                <div className='flex items-center gap-2'>
                    <button
                        type='button'
                        onClick={handleNearMe}
                        disabled={locating}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${usingLocation
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                            } disabled:opacity-60`}
                    >
                        <FaLocationArrow />
                        {locating ? 'Locating…' : usingLocation ? 'Near me: on' : 'Near me'}
                    </button>

                    <label htmlFor='sort' className='sr-only'>Sort by</label>
                    <select
                        id='sort'
                        value={filters.sort}
                        onChange={(e) => {
                            const next = { ...filters, sort: e.target.value };
                            setFilters(next);
                            pushFilters(next);
                        }}
                        className='border border-gray-300 rounded-lg px-3 py-2 text-sm'
                    >
                        {SORT_CHOICES.map((choice) => (
                            <option key={choice.value} value={choice.value}>
                                {choice.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {open && (
                <form onSubmit={handleApply} className='mt-4 border-t border-gray-100 pt-4'>
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                        <div>
                            <label htmlFor='minPrice' className='block text-sm text-gray-700 mb-1'>
                                Min price (₨/day)
                            </label>
                            <input
                                type='number'
                                id='minPrice'
                                min='0'
                                placeholder='Any'
                                value={filters.minPrice}
                                onChange={(e) => setField('minPrice', e.target.value)}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2'
                            />
                        </div>

                        <div>
                            <label htmlFor='maxPrice' className='block text-sm text-gray-700 mb-1'>
                                Max price (₨/day)
                            </label>
                            <input
                                type='number'
                                id='maxPrice'
                                min='0'
                                placeholder='Any'
                                value={filters.maxPrice}
                                onChange={(e) => setField('maxPrice', e.target.value)}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2'
                            />
                        </div>

                        <div>
                            <label htmlFor='minBeds' className='block text-sm text-gray-700 mb-1'>Beds</label>
                            <select
                                id='minBeds'
                                value={filters.minBeds}
                                onChange={(e) => setField('minBeds', e.target.value)}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2'
                            >
                                {MIN_CHOICES.map((choice) => (
                                    <option key={choice.value} value={choice.value}>{choice.label}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor='minBaths' className='block text-sm text-gray-700 mb-1'>Baths</label>
                            <select
                                id='minBaths'
                                value={filters.minBaths}
                                onChange={(e) => setField('minBaths', e.target.value)}
                                className='w-full border border-gray-300 rounded-lg px-3 py-2'
                            >
                                {MIN_CHOICES.map((choice) => (
                                    <option key={choice.value} value={choice.value}>{choice.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {usingLocation && (
                        <div className='mt-4 flex flex-wrap items-center gap-3'>
                            <label htmlFor='radius' className='text-sm text-gray-700'>Search within</label>
                            <select
                                id='radius'
                                value={filters.radius}
                                onChange={(e) => setField('radius', e.target.value)}
                                className='border border-gray-300 rounded-lg px-3 py-2'
                            >
                                {RADIUS_CHOICES.map((km) => (
                                    <option key={km} value={String(km)}>{km} km</option>
                                ))}
                            </select>
                            <button
                                type='button'
                                onClick={() => {
                                    const next = { ...filters, lat: '', lng: '', sort: filters.sort === 'distance' ? '' : filters.sort };
                                    setFilters(next);
                                    pushFilters(next);
                                }}
                                className='text-sm text-blue-500 hover:underline'
                            >
                                Clear location
                            </button>
                        </div>
                    )}

                    <fieldset className='mt-4'>
                        <legend className='text-sm text-gray-700 mb-2'>Amenities</legend>
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
                            {AMENITY_OPTIONS.map((amenity) => (
                                <label key={amenity} className='flex items-center gap-2 text-sm text-gray-700'>
                                    <input
                                        type='checkbox'
                                        checked={filters.amenities.includes(amenity)}
                                        onChange={() => toggleAmenity(amenity)}
                                    />
                                    {amenity}
                                </label>
                            ))}
                        </div>
                    </fieldset>

                    <div className='mt-4 flex gap-3'>
                        <button
                            type='submit'
                            className='bg-blue-500 hover:bg-blue-600 text-white px-5 py-2 rounded-lg'
                        >
                            Apply filters
                        </button>
                        <button
                            type='button'
                            onClick={handleReset}
                            className='px-5 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50'
                        >
                            Reset
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default PropertySearchFilters;
