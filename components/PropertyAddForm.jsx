'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useRouter } from 'next/navigation';
import { propertySchema } from '@/lib/propertySchema';
import { PROPERTY_TYPES } from '@/lib/propertyTypes';

const PropertyAddForm = () => {
    // here i am using mounted to make sure the UI renders
    // only in the browser 
    const [mounted, setMounted] = useState(false);
    const [fields, setFields] = useState({
        type: '',
        name: '',
        description: '',
        location: {
            city: '',
            state: '',
            lat: '',
            lng: ''
        },
        beds: '',
        baths: '',
        square_feet: '',
        amenities: [],
        rates: {
            daily: '',
        },
        seller_info: {
            name: '',
            email: '',
            phone: '',
        },
        images: []
    });
    const [errors, setErrors] = useState({});
    const [locationStatus, setLocationStatus] = useState('idle');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isProcessingImages, setIsProcessingImages] = useState(false);
    const router = useRouter();

    // kept in step with the limits the API enforces in app/api/properties/route.js
    const MAX_IMAGES = 4;
    const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
    // longest edge a listing photo is kept at, plenty for the gallery
    const MAX_IMAGE_DIMENSION = 1600;

    const getCurrentPosition = (options) =>
        new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });

    const handleGetCurrentLocation = async () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported in this browser');
            return;
        }

        try {
            setLocationStatus('loading');
            let position;

            // First try high-accuracy GPS, then fall back to faster network-based location.
            try {
                position = await getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                });
            } catch {
                position = await getCurrentPosition({
                    enableHighAccuracy: false,
                    timeout: 20000,
                    maximumAge: 60000,
                });
            }

            const { latitude, longitude } = position.coords;

            setFields((prevFields) => ({
                ...prevFields,
                location: {
                    ...prevFields.location,
                    lat: latitude,
                    lng: longitude,
                },
            }));

            setLocationStatus('success');
        } catch (error) {
            console.log(error);
            setLocationStatus('error');
            if (error?.code === 1) {
                toast.error('Location access denied. Please allow location permission in your browser.');
                return;
            }
            if (error?.code === 2) {
                toast.error('Location unavailable right now. Try again in an open area or with better network.');
                return;
            }
            if (error?.code === 3) {
                toast.error('Location request timed out. Please try again.');
                return;
            }
            toast.error('Unable to get your current location');
        }
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // console.log(e.target.value);

        // for nested object
        if (name.includes('.')) {
            const [outerKey, innerKey] = name.split('.');
            // console.log(outerKey,innerKey);
            /*
             address.city
             outerKey = address
             innerKey = city
             It will come when name is splited
            */

            setFields((prevFields) => ({
                ...prevFields, // keep everything else the same
                [outerKey]: { // outerKey = "address"
                    ...prevFields[outerKey], // copy all properties inside "address"
                    [innerKey]: value //update "city" with new value
                }
            }));

            // clear the error message for this nested filed
            setErrors((prevErrors) => {
                const newErrors = { ...prevErrors };
                delete newErrors[`${outerKey}.${innerKey}`];
                return newErrors;
            });

        } else {
            setFields((prevFields) => ({
                ...prevFields,
                [name]: value
            }));

            // clear the error message for this field
            setErrors((prevErrors) => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    }

    const handleAmenitiesChange = (e) => {
        const { value, checked } = e.target;

        // Clone the current array
        const updatedAmenities = [...fields.amenities];

        if (checked) {
            // Add value to array
            updatedAmenities.push(value);
        } else {
            // Remove value from array
            const index = updatedAmenities.indexOf(value);
            if (index !== -1) {
                updatedAmenities.splice(index, 1);
            }
        }

        // Update state with updated array
        setFields((prevFields) => ({
            ...prevFields,
            amenities: updatedAmenities
        }));

        // clear the error message for amentities when amenities is selected
        setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors['amenities'];
            return newErrors;
        });
    }

    // Straight off a phone a photo is several megabytes, and four of them made a
    // request too big and slow to finish. A listing never displays them larger
    // than this, so they are scaled down before they are ever uploaded. Anything
    // that cannot be decoded is sent as it came.
    const compressImage = (file) =>
        new Promise((resolve) => {
            if (!file.type.startsWith('image/')) {
                resolve(file);
                return;
            }

            const objectUrl = URL.createObjectURL(file);
            const image = new window.Image();

            image.onload = () => {
                URL.revokeObjectURL(objectUrl);

                const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(image.width, image.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.round(image.width * scale);
                canvas.height = Math.round(image.height * scale);

                const context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, canvas.width, canvas.height);

                canvas.toBlob(
                    (blob) => {
                        // keep the original if compressing somehow made it bigger
                        if (!blob || blob.size >= file.size) {
                            resolve(file);
                            return;
                        }
                        const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
                        resolve(new File([blob], name, { type: 'image/jpeg' }));
                    },
                    'image/jpeg',
                    0.82
                );
            };

            image.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(file);
            };

            image.src = objectUrl;
        });

    const handleImageChange = async (e) => {
        const { files } = e.target;
        // console.log(files);

        // The picker replaces the selection rather than adding to it, otherwise
        // choosing four photos twice silently pushes the list over the limit
        const selectedFiles = Array.from(files);

        if (selectedFiles.length === 0) {
            return;
        }

        if (selectedFiles.length > MAX_IMAGES) {
            toast.error(`You can upload at most ${MAX_IMAGES} images`);
            e.target.value = '';
            return;
        }

        setIsProcessingImages(true);
        const selectedImages = await Promise.all(selectedFiles.map(compressImage));
        setIsProcessingImages(false);

        const oversized = selectedImages.find((file) => file.size > MAX_IMAGE_BYTES);
        if (oversized) {
            toast.error(`"${oversized.name}" is larger than ${MAX_IMAGE_BYTES / (1024 * 1024)}MB. Please choose a smaller image.`);
            e.target.value = '';
            return;
        }

        // Update state with array of images
        setFields((prevFields) => ({
            ...prevFields,
            images: selectedImages
        }));

        // clear error message for images when images is selected
        setErrors((prevErrors) => {
            const newErrors = { ...prevErrors };
            delete newErrors['images'];
            return newErrors;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isSubmitting) {
            return;
        }

        try {
            setErrors({}); // clear the previous errors

            // take messy form input -> check it -> clean it -> make it safe
            const parseData = propertySchema.parse({
                type: fields.type,
                name: fields.name,
                description: fields.description,
                location: {
                    city: fields.location.city,
                    state: fields.location.state,
                    lat: fields.location.lat,
                    lng: fields.location.lng
                },
                beds: fields.beds,
                baths: fields.baths,
                square_feet: fields.square_feet,
                amenities: fields.amenities,
                rates: {
                    daily: fields.rates.daily
                },
                seller_info: {
                    name: fields.seller_info.name,
                    email: fields.seller_info.email,
                    phone: fields.seller_info.phone
                },
                images: fields.images
            });

            // it is used to send mixed data i.e text + numbers + arrays + objects + files
            const formData = new FormData();

            /*
              FormData can only handle key-value pairs where the value is string, blob/files.
              FormData doesn't support Objects, Arrays, Numbers, Booleans directly.
            */
            for (const key in parseData) {
                if (key === 'location' || key === 'rates' || key === 'seller_info') {
                    formData.append(key, JSON.stringify(parseData[key]));
                } else if (key === 'images') {
                    parseData.images.forEach((file) => formData.append('images', file));
                } else if (key === 'amenities') {
                    parseData.amenities?.forEach((item) => formData.append('amenities', item));
                } else {
                    formData.append(key, parseData[key]);
                }
            }

            // uploading several photos takes a few seconds, so the button has to
            // show it is working instead of looking like nothing happened
            setIsSubmitting(true);

            const res = await fetch(`/api/properties`, {
                method: 'POST',
                body: formData
            });

            if (res.ok) {
                // it is not live yet, so send them to their listings where the
                // pending badge explains what happens next
                toast.success('Property submitted. An admin will review it before it goes live.');
                router.push('/profile');
                return;
            }

            // the route replies with a plain text reason for the cases the user
            // can act on, such as too many or too large images
            const message = await res.text();
            toast.error(message || 'Something went wrong');
        } catch (error) {
            // console.log('Full error:', error); // Debug log

            // Check if it's a Zod validation error
            if (error.name === 'ZodError' && error.issues) {
                const fieldErrors = {};
                error.issues.forEach((issue) => {
                    const path = issue.path.join('.');
                    fieldErrors[path] = issue.message;
                });
                setErrors(fieldErrors);
                // console.log('Validation errors:', fieldErrors); // Debug log
                toast.error('Please fix the highlighted fields');
                return;
            }

            // Handle other errors
            toast.error('Something went wrong');
            console.log(error);
        } finally {
            setIsSubmitting(false);
        }
    };


    return mounted && (
        // Since we are uploading image so we have to encType='multipart/form-data'
        <form encType='multipart/form-data' onSubmit={handleSubmit}>
            <h2 className="text-3xl text-center font-semibold mb-6">
                Add Property
            </h2>

            <div className="mb-4">
                <label
                    htmlFor="type"
                    className="block text-gray-700 font-bold mb-2"
                >Property Type</label
                >
                <select
                    id="type"
                    name="type"
                    className="border rounded w-full py-2 px-3"
                    value={fields.type}
                    onChange={handleChange}
                >
                    <option value=''>Select Type</option>
                    {PROPERTY_TYPES.map((option)=>(
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
                {errors.type && <p className='text-red-500 text-sm'>{errors.type}</p>}
            </div>
            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2"
                >Listing Name</label
                >
                <input
                    type="text"
                    id="name"
                    name="name"
                    className="border rounded w-full py-2 px-3 mb-2"
                    placeholder="eg. Beautiful Apartment In Miami"
                    value={fields.name}
                    onChange={handleChange}
                />
                {errors.name && <p className='text-red-500 text-sm'>{errors.name}</p>}
            </div>
            <div className="mb-4">
                <label
                    htmlFor="description"
                    className="block text-gray-700 font-bold mb-2"
                >Description</label
                >
                <textarea
                    id="description"
                    name="description"
                    className="border rounded w-full py-2 px-3"
                    rows="4"
                    placeholder="Add a description of your property"
                    value={fields.description}
                    onChange={handleChange}
                ></textarea>
                {errors.description && <p className='text-red-500 text-sm'>{errors.description}</p>}
            </div>

            <div className="mb-4 bg-blue-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <label className="block text-gray-700 font-bold">Location</label>
                    <button
                        type="button"
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                        onClick={handleGetCurrentLocation}
                        disabled={locationStatus === 'loading'}
                    >
                        {locationStatus === 'loading' ? 'Getting Location...' : 'Use Current Location'}
                    </button>
                </div>
                {locationStatus === 'success' && (
                    <p className="text-sm text-green-700 mb-2">Current location saved.</p>
                )}
                {locationStatus === 'error' && (
                    <p className="text-sm text-red-600 mb-2">Unable to get current location.</p>
                )}
                <input
                    type="text"
                    id="city"
                    name="location.city"
                    className="border rounded w-full py-2 px-3 mb-2"
                    placeholder="City"
                    value={fields.location.city}
                    onChange={handleChange}
                />
                {errors['location.city'] && <p className='text-red-500 text-sm'>{errors['location.city']}</p>}
                <input
                    type="text"
                    id="state"
                    name="location.state"
                    className="border rounded w-full py-2 px-3 mb-2"
                    placeholder="Province"
                    value={fields.location.state}
                    onChange={handleChange}
                />
                {errors['location.state'] && <p className='text-red-500 text-sm'>{errors['location.state']}</p>}
            </div>

            <div className="mb-4 flex flex-wrap">
                <div className="w-full sm:w-1/3 pr-2">
                    <label htmlFor="beds" className="block text-gray-700 font-bold mb-2"
                    >Beds</label
                    >
                    <input
                        type="number"
                        id="beds"
                        name="beds"
                        className="border rounded w-full py-2 px-3"
                        value={fields.beds}
                        onChange={handleChange}
                    />
                    {errors.beds && <p className='text-red-500 text-sm'>{errors.beds}</p>}
                </div>
                <div className="w-full sm:w-1/3 px-2">
                    <label htmlFor="baths" className="block text-gray-700 font-bold mb-2"
                    >Baths</label
                    >
                    <input
                        type="number"
                        id="baths"
                        name="baths"
                        className="border rounded w-full py-2 px-3"
                        value={fields.baths}
                        onChange={handleChange}
                    />
                    {errors.baths && <p className='text-red-500 text-sm'>{errors.baths}</p>}
                </div>
                <div className="w-full sm:w-1/3 pl-2">
                    <label
                        htmlFor="square_feet"
                        className="block text-gray-700 font-bold mb-2"
                    >Square Feet</label
                    >
                    <input
                        type="number"
                        id="square_feet"
                        name="square_feet"
                        className="border rounded w-full py-2 px-3"
                        value={fields.square_feet}
                        onChange={handleChange}
                    />
                    {errors.square_feet && <p className='text-red-500 text-sm'>{errors.square_feet}</p>}
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2"
                >Amenities</label
                >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_wifi"
                            name="amenities"
                            value="Wifi"
                            className="mr-2"
                            checked={fields.amenities.includes('Wifi')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_wifi">Wifi</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_kitchen"
                            name="amenities"
                            value="Full Kitchen"
                            className="mr-2"
                            checked={fields.amenities.includes('Full Kitchen')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_kitchen">Full kitchen</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_washer_dryer"
                            name="amenities"
                            value="Washer & Dryer"
                            className="mr-2"
                            checked={fields.amenities.includes('Washer & Dryer')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_washer_dryer">Washer & Dryer</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_free_parking"
                            name="amenities"
                            value="Free Parking"
                            className="mr-2"
                            checked={fields.amenities.includes('Free Parking')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_free_parking">Free Parking</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_pool"
                            name="amenities"
                            value="Swimming Pool"
                            className="mr-2"
                            checked={fields.amenities.includes('Swimming Pool')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_pool">Swimming Pool</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_hot_tub"
                            name="amenities"
                            value="Hot Tub"
                            className="mr-2"
                            checked={fields.amenities.includes('Hot Tub')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_hot_tub">Hot Tub</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_24_7_security"
                            name="amenities"
                            value="24/7 Security"
                            className="mr-2"
                            checked={fields.amenities.includes('24/7 Security')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_24_7_security">24/7 Security</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_wheelchair_accessible"
                            name="amenities"
                            value="Wheelchair Accessible"
                            className="mr-2"
                            checked={fields.amenities.includes('Wheelchair Accessible')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_wheelchair_accessible"
                        >Wheelchair Accessible</label
                        >
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_elevator_access"
                            name="amenities"
                            value="Elevator Access"
                            className="mr-2"
                            checked={fields.amenities.includes('Elevator Access')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_elevator_access">Elevator Access</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_dishwasher"
                            name="amenities"
                            value="Dishwasher"
                            className="mr-2"
                            checked={fields.amenities.includes('Dishwasher')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_dishwasher">Dishwasher</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_gym_fitness_center"
                            name="amenities"
                            value="Gym/Fitness Center"
                            className="mr-2"
                            checked={fields.amenities.includes('Gym/Fitness Center')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_gym_fitness_center"
                        >Gym/Fitness Center</label
                        >
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_air_conditioning"
                            name="amenities"
                            value="Air Conditioning"
                            className="mr-2"
                            checked={fields.amenities.includes('Air Conditioning')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_air_conditioning">Air Conditioning</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_balcony_patio"
                            name="amenities"
                            value="Balcony/Patio"
                            className="mr-2"
                            checked={fields.amenities.includes('Balcony/Patio')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_balcony_patio">Balcony/Patio</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_smart_tv"
                            name="amenities"
                            value="Smart TV"
                            className="mr-2"
                            checked={fields.amenities.includes('Smart TV')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_smart_tv">Smart TV</label>
                    </div>
                    <div>
                        <input
                            type="checkbox"
                            id="amenity_coffee_maker"
                            name="amenities"
                            value="Coffee Maker"
                            className="mr-2"
                            checked={fields.amenities.includes('Coffee Maker')}
                            onChange={handleAmenitiesChange}
                        />
                        <label htmlFor="amenity_coffee_maker">Coffee Maker</label>
                    </div>
                </div>
                {errors.amenities && <p className='text-red-500 text-sm'>{errors.amenities}</p>}
            </div>

            <div className="mb-4 bg-blue-50 p-4">
                <label htmlFor="daily_rate" className="block text-gray-700 font-bold mb-2"
                >Rate Per Day</label
                >
                <input
                    type="number"
                    id="daily_rate"
                    name="rates.daily"
                    className="border rounded w-full py-2 px-3"
                    placeholder="eg. 1500"
                    value={fields.rates.daily}
                    onChange={handleChange}
                />
                <p className='text-gray-600 text-sm mt-1'>
                    Charged for each day of the stay. A guest checks out by 12:00 on their last day.
                </p>
                {errors['rates.daily'] && <p className='text-red-500 text-sm mt-1'>{errors['rates.daily']}</p>}
            </div>

            <div className="mb-4">
                <label
                    htmlFor="seller_name"
                    className="block text-gray-700 font-bold mb-2"
                >Seller Name</label
                >
                <input
                    type="text"
                    id="seller_name"
                    name="seller_info.name"
                    className="border rounded w-full py-2 px-3"
                    placeholder="Name"
                    value={fields.seller_info.name}
                    onChange={handleChange}
                />
                {errors['seller_info.name'] && <p className='text-red-500 text-sm'>{errors['seller_info.name']}</p>}
            </div>
            <div className="mb-4">
                <label
                    htmlFor="seller_email"
                    className="block text-gray-700 font-bold mb-2"
                >Seller Email</label
                >
                <input
                    type="email"
                    id="seller_email"
                    name="seller_info.email"
                    className="border rounded w-full py-2 px-3"
                    placeholder="Email address"
                    value={fields.seller_info.email}
                    onChange={handleChange}
                />
                {errors['seller_info.email'] && <p className='text-red-500 text-sm'>{errors['seller_info.email']}</p>}
            </div>
            <div className="mb-4">
                <label
                    htmlFor="seller_phone"
                    className="block text-gray-700 font-bold mb-2"
                >Seller Phone</label
                >
                <input
                    type="tel"
                    id="seller_phone"
                    name="seller_info.phone"
                    className="border rounded w-full py-2 px-3"
                    placeholder="Phone"
                    value={fields.seller_info.phone}
                    onChange={handleChange}
                />
                {errors['seller_info.phone'] && <p className='text-red-500 text-sm'>{errors['seller_info.phone']}</p>}
            </div>

            <div className="mb-4">
                <label htmlFor="images" className="block text-gray-700 font-bold mb-2"
                >Images (Select up to 4 images)</label
                >
                <input
                    type="file"
                    id="images"
                    name="images"
                    className="border rounded w-full py-2 px-3"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                />
                {isProcessingImages && (
                    <p className='text-sm text-gray-600 mt-1'>Preparing images...</p>
                )}
                {!isProcessingImages && fields.images.length > 0 && (
                    <p className='text-sm text-gray-600 mt-1'>
                        {fields.images.length} image{fields.images.length > 1 ? 's' : ''} selected
                    </p>
                )}
                {errors.images && <p className='text-red-500 text-sm'>{errors.images}</p>}
            </div>

            <div>
                <button
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full w-full focus:outline-none focus:shadow-outline disabled:opacity-60 disabled:cursor-not-allowed"
                    type="submit"
                    disabled={isSubmitting || isProcessingImages}
                >
                    {isSubmitting ? 'Adding Property...' : 'Add Property'}
                </button>
            </div>
        </form>
    );
}

export default PropertyAddForm;
