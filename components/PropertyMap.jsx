'use client';
import { useEffect, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { Marker } from 'react-map-gl';
import { setDefaults, fromAddress } from 'react-geocode';
import Spinner from './Spinner';
import Image from 'next/image';
import pin from '@/assets/images/pin.svg';
import { useTheme } from '@/components/ThemeProvider';

const PropertyMap = ({ property }) => {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 12,
    width: '100%',
    height: '500px',
  });
  const [loading, setLoading] = useState(true);
  const [geocodeError, setGeocodeError] = useState(false);
  const { resolvedTheme } = useTheme();

  setDefaults({
    key: process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY,
    language: 'en',
    region: 'us',
  });

  useEffect(() => {
    const fetchCoords = async () => {
      try {
        const location = property?.location || {};
        const hasCoords =
          location.lat !== undefined &&
          location.lng !== undefined &&
          location.lat !== null &&
          location.lng !== null &&
          location.lat !== '' &&
          location.lng !== '';

        const latValue = Number(location.lat);
        const lngValue = Number(location.lng);

        if (hasCoords && Number.isFinite(latValue) && Number.isFinite(lngValue)) {
          setLat(latValue);
          setLng(lngValue);
          setViewport({
            ...viewport,
            latitude: latValue,
            longitude: lngValue,
          });
          setLoading(false);
          return;
        }

        const address = `${location.city || ''} ${location.state || ''}`.trim();
        const res = await fromAddress(address);

        //  Check for results
        if (res.results.length === 0) {
          // No results found
          setGeocodeError(true);
          setLoading(false);
          return;
        }

        const { lat, lng } = res.results[0].geometry.location;

        setLat(lat);
        setLng(lng);
        setViewport({
          ...viewport,
          latitude: lat,
          longitude: lng,
        });

        setLoading(false);
      } catch (error) {
        console.log(error);
        setGeocodeError(true);
        setLoading(false);
      }
    };

    fetchCoords();
  }, []);

  if (loading) return <Spinner loading={loading} />;

  // Handle case where geocoding failed
  if (geocodeError) {
    return <div className='text-xl'>No location data found</div>;
  }

  return (
    !loading && (
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        mapLib={import('mapbox-gl')}
        initialViewState={{
          longitude: lng,
          latitude: lat,
          zoom: 15,
        }}
        style={{ width: '100%', height: 500 }}
        mapStyle={
          resolvedTheme === 'dark'
            ? 'mapbox://styles/mapbox/dark-v11'
            : 'mapbox://styles/mapbox/streets-v9'
        }
      >
        <Marker longitude={lng} latitude={lat} anchor='bottom'>
          <Image src={pin} alt='location' width={40} height={40} />
        </Marker>
      </Map>
    )
  );
};
export default PropertyMap;