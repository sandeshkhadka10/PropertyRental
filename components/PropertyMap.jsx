// 'use client';
// import { useEffect, useState } from 'react';
// import 'mapbox-gl/dist/mapbox-gl.css';
// import Map, { Marker } from 'react-map-gl';
// import { setDefaults, fromAddress } from 'react-geocode';
// import Spinner from './Spinner';
// import Image from 'next/image';
// import pin from '@/assets/images/pin.svg';

const PropertyMap = ({ property }) => {
    // const [lat, setLat] = useState(null);
    // const [lng, setLng] = useState(null);
    // const [viewport, setViewport] = useState({
    //     latitude: 0,
    //     longitude: 0,
    //     zoom: 12,
    //     width: '100%',
    //     height: '500px'
    // });
    // const [loading, setLoading] = useState(true);

    // setDefaults({
    //     key: process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY,
    //     language: "en",
    //     region: "us", 
    // });

    // useEffect(()=>{
    //     const fetchCoords = async () =>{
    //         const res = await fromAddress(`${property.location.street}
    //             ${property.location.city}
    //             ${property.location.state}
    //             ${property.location.zipcode}
    //         `);

    //         const {lat,lng} = res.results[0].geometry.location;
    //         console.log(lat,lng);
    //     }
    //     fetchCoords();
    // },[]);

    return (
        <div>
            Displaying map here
        </div>
    )
}

export default PropertyMap;