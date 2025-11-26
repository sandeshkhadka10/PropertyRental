'use client';
import {useState,useEffect} from 'react';
import {useSession} from 'next-auth/react';
import {toast} from 'react-toastify';
import { FaBookmark } from 'react-icons/fa';

const BookmarkButton = ({property}) => {
    const {data:session} = useSession();
    const userId = session?.user?.id;

    const [isBookMarked, setIsBookMarked] = useState(false);

    const handleClick = async()=>{
        if(!userId){
            toast.error('You need to sign in to bookmark a property');
            return;
        }
        try{
            // since i am specifying the data i am sending is in json format so header is defined
            const res = await fetch('/api/bookmarks',{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body: JSON.stringify({
                    propertyId: property._id
                })
            });
            if(res.status === 200){
                const data = await res.json();
                toast.success(data.message);
                setIsBookMarked(data.isBookMarked);
            }
        }catch(error){
            console.log(error);
            toast.error('Something went wrong');
        }
    }
    return (
        <button
        onClick={handleClick}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold w-full py-2 px-4 rounded-full flex items-center justify-center"
        >
            <FaBookmark className="mr-2" /> Bookmark Property
        </button>
    )
}

export default BookmarkButton;