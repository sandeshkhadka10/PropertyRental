'use client';
import {useState,useEffect,useMemo} from 'react';
import {toast} from 'react-toastify';
import {FaBell,FaCheckDouble,FaRegBell} from 'react-icons/fa';
import Spinner from '@/components/Spinner';
import NotificationItem from '@/components/NotificationItem';
import {useGlobalContext} from '@/context/GlobalContext';
import {formatDayGroup} from '@/utils/formatDateTime';

const Notifications = () => {
    const [notifications,setNotifications] = useState([]);
    const [loading,setLoading] = useState(true);
    const [filter,setFilter] = useState('all');

    const {setUnreadNotificationCount} = useGlobalContext();

    useEffect(()=>{
        const getNotifications = async()=>{
            try{
                const res = await fetch('/api/notifications');
                if(res.status === 200){
                    const data = await res.json();
                    setNotifications(data);
                }
            }catch(error){
                console.log('Error fetching notifications: ',error);
            }finally{
                setLoading(false);
            }
        }
        getNotifications();
    },[]);

    // the individual rows own their own read state, this only keeps the list's
    // copy in step so the "Mark all as read" button knows what is left
    const handleReadChange = (id,read)=>{
        setNotifications((current)=>current.map((notification)=>(
            notification._id === id ? {...notification,read} : notification
        )));
    };

    const handleDeleted = (id)=>{
        setNotifications((current)=>current.filter((notification)=>notification._id !== id));
    };

    const handleMarkAllRead = async()=>{
        try{
            const res = await fetch('/api/notifications',{method:'PUT'});
            if(res.status === 200){
                setNotifications((current)=>current.map((notification)=>({...notification,read:true})));
                setUnreadNotificationCount(0);
                toast.success('All notifications marked as read');
            }
        }catch(error){
            console.log(error);
            toast.error('Something went wrong');
        }
    };

    const unread = notifications.filter((notification)=>!notification.read).length;

    // newest first, then cut into days - a bare list of timestamps is hard to
    // scan, "Today / Yesterday" is not
    const groups = useMemo(()=>{
        const shown = [...notifications]
            .filter((notification)=>filter !== 'unread' || !notification.read)
            .sort((a,b)=>new Date(b.createdAt) - new Date(a.createdAt));

        return shown.reduce((acc,notification)=>{
            const label = formatDayGroup(notification.createdAt);
            const last = acc[acc.length - 1];

            if(last && last.label === label){
                last.items.push(notification);
            }else{
                acc.push({label,items:[notification]});
            }

            return acc;
        },[]);
    },[notifications,filter]);

    const tabs = [
        {key:'all',label:'All',count:notifications.length},
        {key:'unread',label:'Unread',count:unread}
    ];

    const tabClass = (active)=>
        `inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`;

    return loading ? (<Spinner loading={loading} />)
        :
        (
            <section className="bg-blue-50 min-h-screen">
                <div className="container m-auto max-w-5xl px-4 py-10 md:py-16">
                    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-md md:p-8">
                        <header className='flex flex-wrap items-start gap-4 border-b border-gray-100 pb-6'>
                            <div className='relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600'>
                                <FaBell className='text-xl' />
                                {unread > 0 && (
                                    <span className='absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white'>
                                        {unread}
                                    </span>
                                )}
                            </div>

                            <div className='min-w-0 flex-1'>
                                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Notifications</h1>
                                <p className='mt-1 text-sm text-gray-500'>
                                    {notifications.length === 0
                                        ? 'Updates on your listings and bookings will appear here'
                                        : unread > 0
                                            ? `${unread} unread of ${notifications.length} update${notifications.length > 1 ? 's' : ''}`
                                            : 'You are all caught up'}
                                </p>
                            </div>

                            {unread > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className='inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100'
                                >
                                    <FaCheckDouble className='text-xs' />
                                    Mark all as read
                                </button>
                            )}
                        </header>

                        {notifications.length > 0 && (
                            <div className='py-5'>
                                <div className='inline-flex flex-wrap items-center gap-1 rounded-xl bg-gray-50 p-1'>
                                    {tabs.map((tab)=>(
                                        <button
                                            key={tab.key}
                                            onClick={()=>setFilter(tab.key)}
                                            className={tabClass(filter === tab.key)}
                                        >
                                            {tab.label}
                                            <span
                                                className={`rounded-full px-1.5 text-xs ${filter === tab.key ? 'bg-white/20' : 'bg-gray-200 text-gray-600'}`}
                                            >
                                                {tab.count}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {notifications.length === 0 ? (
                            <div className='py-14 text-center'>
                                <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400'>
                                    <FaRegBell className='text-2xl' />
                                </div>
                                <p className='mt-4 text-lg font-semibold text-gray-700'>No notifications yet</p>
                                <p className='mt-1 text-sm text-gray-500'>
                                    Approvals, booking requests and status changes all show up on this page.
                                </p>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className='py-12 text-center'>
                                <p className='text-gray-600'>Nothing unread right now.</p>
                                <button
                                    onClick={()=>setFilter('all')}
                                    className='mt-3 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100'
                                >
                                    Show all notifications
                                </button>
                            </div>
                        ) : (
                            <div className='space-y-8'>
                                {groups.map((group)=>(
                                    <div key={group.label}>
                                        <h2 className='mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                                            {group.label}
                                        </h2>
                                        <div className='space-y-3'>
                                            {group.items.map((notification)=>(
                                                <NotificationItem
                                                    key={notification._id}
                                                    notification={notification}
                                                    onReadChange={handleReadChange}
                                                    onDeleted={handleDeleted}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        )

}

export default Notifications;
