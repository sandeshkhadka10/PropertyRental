'use client';
import {useEffect} from 'react';
import {useGlobalContext} from '@/context/GlobalContext';

// The red bubble on the navbar bell. Mirrors UnreadMessageCount: one fetch when
// the session appears, then the notifications page keeps the number honest as
// rows are read or deleted.
const NotificationCount = ({session}) => {
    const {unreadNotificationCount,setUnreadNotificationCount} = useGlobalContext();

    useEffect(()=>{
        if(!session){
            return;
        }
        const fetchUnreadNotifications = async()=>{
            try{
                const res = await fetch('/api/notifications/unread-count');
                if(res.status === 200){
                    const data = await res.json();
                    setUnreadNotificationCount(data);
                }
            }catch(error){
                console.log(error);
            }
        }
        fetchUnreadNotifications();
    },[session]);

    return unreadNotificationCount > 0 && (
        <span className='absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full'>
            {unreadNotificationCount}
        </span>
    )
}

export default NotificationCount;
