'use client';
import {useState,useEffect} from 'react';
import {useParams} from 'next/navigation';
import {fetchProperty} from '@/utils/requests.js';
import PropertyHeaderImage from '@/components/PropertyHeaderImage';

const PropertyPage=()=>{
    const {id} = useParams();
    const [property,setProperty] = useState(null);

    // it is used to track whether the property data is still being fetched or not.
    const [loading,setLoading] = useState(true);

    useEffect(()=>{
        const fetchPropertyData = async()=>{
            if(!id){
                return;
            }
            try{
                const property = await fetchProperty(id);
                setProperty(property);
            }catch(error){
                console.error('Error fetching property: ',error);
            }finally{
                setLoading(false);
            }
        };
        if(property === null){
            fetchPropertyData();
        }
    },[id,property]);

    if(!property && !loading){
        return(
            <h1 className='text-center text-2xl font-bold mt-10'>Property Not Found!</h1>
        )
    }

    return(
        <>
          {!loading && property && (
            <>
              <PropertyHeaderImage image={property.images[0]}/>
          </>)}
        </>
    )
}
export default PropertyPage;