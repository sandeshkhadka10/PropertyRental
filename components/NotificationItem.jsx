'use client';
import {useState} from 'react';
import Link from 'next/link';
import {toast} from 'react-toastify';
import {
    FaArrowRight,
    FaCalendarCheck,
    FaCalendarTimes,
    FaCheck,
    FaCheckCircle,
    FaClipboardCheck,
    FaClock,
    FaFlag,
    FaHome,
    FaTimesCircle,
    FaTrash,
    FaUndo
} from 'react-icons/fa';
import {useGlobalContext} from '@/context/GlobalContext';
import {formatDateTime,formatRelativeTime} from '@/utils/formatDateTime';

// Icon and accent per notification type, so a good outcome and a bad one are
// told apart before either is read. The tint is the icon's own hue, which keeps
// the row readable without shouting.
const STYLES = {
    property_submitted:{icon:FaClock,colour:'text-blue-600',tint:'bg-blue-50'},
    property_pending_review:{icon:FaClipboardCheck,colour:'text-blue-600',tint:'bg-blue-50'},
    property_approved:{icon:FaCheckCircle,colour:'text-green-600',tint:'bg-green-50'},
    property_rejected:{icon:FaTimesCircle,colour:'text-red-600',tint:'bg-red-50'},
    property_flagged:{icon:FaFlag,colour:'text-orange-600',tint:'bg-orange-50'},
    property_removed:{icon:FaTrash,colour:'text-red-600',tint:'bg-red-50'},
    booking_requested:{icon:FaClock,colour:'text-blue-600',tint:'bg-blue-50'},
    booking_confirmed:{icon:FaCalendarCheck,colour:'text-green-600',tint:'bg-green-50'},
    booking_declined:{icon:FaCalendarTimes,colour:'text-red-600',tint:'bg-red-50'},
    booking_cancelled:{icon:FaCalendarTimes,colour:'text-red-600',tint:'bg-red-50'},
    booking_completed:{icon:FaCheckCircle,colour:'text-green-600',tint:'bg-green-50'}
};

const actionClass =
    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1';

const NotificationItem = ({notification,onReadChange,onDeleted}) => {
    const [isRead,setIsRead] = useState(notification.read);
    const [isDeleted,setIsDeleted] = useState(false);

    const {setUnreadNotificationCount} = useGlobalContext();

    const {icon:Icon,colour,tint} = STYLES[notification.type] || {
        icon:FaHome,
        colour:'text-gray-500',
        tint:'bg-gray-100'
    };

    const handleReadClick = async()=>{
        try{
            const res = await fetch(`/api/notifications/${notification._id}`,{
                method:'PUT'
            });
            if(res.status === 200){
                const {read} = await res.json();
                setIsRead(read);
                setUnreadNotificationCount((prevCount)=>(
                    read ? Math.max(prevCount - 1,0) : prevCount + 1
                ));
                onReadChange?.(notification._id,read);
                toast.success(read ? 'Marked as read' : 'Marked as new');
            }
        }catch(error){
            console.log(error);
            toast.error('Something went wrong');
        }
    };

    const handleDeleteClick = async()=>{
        try{
            const res = await fetch(`/api/notifications/${notification._id}`,{
                method:'DELETE'
            });
            if(res.status === 200){
                setIsDeleted(true);
                // only an unread row was ever counted in the badge
                if(!isRead){
                    setUnreadNotificationCount((prevCount)=>Math.max(prevCount - 1,0));
                }
                onDeleted?.(notification._id);
                toast.success('Notification deleted');
            }
        }catch(error){
            console.log(error);
            toast.error('Notification was not deleted');
        }
    };

    if(isDeleted){
        return null;
    }

    return (
        <article
            className={`group relative overflow-hidden rounded-xl border shadow-sm transition hover:shadow-md ${isRead ? 'border-gray-200 bg-white' : 'border-blue-200 bg-blue-50'}`}
        >
            {!isRead && (
                <span className='absolute inset-y-0 left-0 w-1 bg-blue-500' aria-hidden='true' />
            )}

            <div className='flex gap-4 p-4 pl-5'>
                <div
                    className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${tint} ${colour}`}
                    aria-hidden='true'
                >
                    <Icon className='text-lg' />
                </div>

                <div className='min-w-0 flex-1'>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                        <h2 className='text-base font-bold text-gray-900'>{notification.title}</h2>
                        {!isRead && (
                            <span className='rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white'>
                                New
                            </span>
                        )}
                    </div>

                    {notification.body && (
                        <p className='mt-1 leading-relaxed text-gray-700'>{notification.body}</p>
                    )}

                    <p className='mt-2 text-sm text-gray-500'>
                        <time
                            dateTime={notification.createdAt}
                            title={formatDateTime(notification.createdAt)}
                        >
                            {formatRelativeTime(notification.createdAt)}
                        </time>
                    </p>

                    <div className='mt-4 flex flex-wrap items-center gap-2'>
                        {notification.link && (
                            <Link
                                href={notification.link}
                                className={`${actionClass} bg-blue-600 text-white hover:bg-blue-700`}
                            >
                                View
                                <FaArrowRight className='text-xs' />
                            </Link>
                        )}

                        <button
                            onClick={handleReadClick}
                            className={`${actionClass} border border-gray-200 bg-white text-gray-700 hover:bg-gray-100`}
                        >
                            {isRead ? <FaUndo className='text-xs' /> : <FaCheck className='text-xs' />}
                            {isRead ? 'Mark As New' : 'Mark As Read'}
                        </button>

                        <button
                            onClick={handleDeleteClick}
                            aria-label='Delete notification'
                            className={`${actionClass} ml-auto text-gray-500 hover:bg-red-50 hover:text-red-600`}
                        >
                            <FaTrash className='text-xs' />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </article>
    )
}

export default NotificationItem;
