'use client';
import {useRouter,useParams,useSearchParams,usePathname} from 'next/navigation';

const PropertyPage=()=>{
    const router = useRouter();

    const {id} = useParams;

    // used for query search
    const searchParams = useSearchParams();
    const name = searchParams.get('name');

    const pathName = usePathname();

    return(
        <button onClick={()=>router.push('/')} className='bg-blue-500 p-5'>Go Home {pathName}</button> 
    )
}
export default PropertyPage;