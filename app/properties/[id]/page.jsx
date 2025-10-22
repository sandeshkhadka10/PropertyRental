'use client';
import {useState,useEffect} from 'react';
import {useParams} from 'next/navigation';
import {fetchProperty} from '@/utils/requests.js';
// import PropertyHeaderImage from '@/components/PropertyHeaderImage';

const PropertyPage=()=>{
    const {id} = useParams();
    const [property,setProperty] = useState(null);
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

    return(
        <div>Single Property Page</div>
    )
}
export default PropertyPage;