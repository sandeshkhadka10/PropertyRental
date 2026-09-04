'use client';
import {useState} from 'react';
import {toast} from 'react-toastify';
import Link from "next/link";
import {
    FaCheck,
    FaEnvelope,
    FaHome,
    FaPaperPlane,
    FaPhoneAlt,
    FaQuoteLeft,
    FaReply,
    FaTrash,
    FaUndo
} from 'react-icons/fa';
import {useGlobalContext} from '@/context/GlobalContext';
import {formatDateTime,formatRelativeTime} from '@/utils/formatDateTime';

// One button style for the whole card, so the row of actions reads as a set
// rather than three unrelated controls.
const actionClass =
    'inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:opacity-60';

const Message = ({message,onReadChange,onDeleted}) => {
    const [isRead,setIsRead] = useState(message.read);
    const [isDeleted,setIsDeleted] = useState(false);

    // the in-site reply: the form is hidden until it is asked for, and once a
    // reply is sent it stays on the card as a record of what was said
    const [showReplyForm,setShowReplyForm] = useState(false);
    const [replyBody,setReplyBody] = useState('');
    const [isSending,setIsSending] = useState(false);
    const [sentReply,setSentReply] = useState(null);

    // deleting a message cannot be undone, so the button asks once first
    const [confirmDelete,setConfirmDelete] = useState(false);

    const {setUnreadMessageCount} = useGlobalContext();

    const handleReadClick = async()=>{
        try{
            const res = await fetch(`/api/messages/${message._id}`,{
                method:'PUT'
            });
            if(res.status === 200){
                const {read} = await res.json();
                setIsRead(read);
                setUnreadMessageCount((prevCount)=>(
                    read ? prevCount - 1 : prevCount + 1
                ));
                // the list keeps its own copy so the filter counts stay honest
                onReadChange?.(message._id,read);
                if(read){
                    toast.success('Marked as read');
                }else{
                    toast.error('Mark as new');
                }
            }
        }catch(error){
            console.log(error);
            toast.error('Something went wrong');
        }
    };

    const handleReplySubmit = async(e)=>{
        e.preventDefault();

        if(!replyBody.trim()){
            toast.error('Reply message is required');
            return;
        }

        try{
            setIsSending(true);

            const res = await fetch(`/api/messages/${message._id}/reply`,{
                method:'POST',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({message:replyBody})
            });

            const result = await res.json();

            if(res.status === 200){
                setSentReply(result.reply);
                setShowReplyForm(false);
                setReplyBody('');

                // the reply marks the original read on the server, so the badge
                // has to lose it here too
                if(result.read && !isRead){
                    setIsRead(true);
                    setUnreadMessageCount((prevCount)=>Math.max(prevCount - 1,0));
                    onReadChange?.(message._id,true);
                }

                toast.success('Reply sent');
            }else{
                toast.error(result.message || 'Reply was not sent');
            }
        }catch(error){
            console.log(error);
            toast.error('Reply was not sent');
        }finally{
            setIsSending(false);
        }
    };

    const handleDeleteClick = async()=>{
        try{
            const res = await fetch(`/api/messages/${message._id}`,{
                method:'DELETE'
            });
            if(res.status === 200){
                setIsDeleted(true);
                // only an unread message was ever counted in the badge
                if(!isRead){
                    setUnreadMessageCount((prevCount)=>Math.max(prevCount - 1,0));
                }
                onDeleted?.(message._id);
                toast.success('Message Deleted');
            }
        }catch(error){
            console.log(error);
            toast.error('Message wasnot deleted');
        }
    };

    if(isDeleted){
        return null;
    }

    const senderName = message.sender?.username || message.name || 'Someone';
    const initial = senderName.trim().charAt(0).toUpperCase() || '?';
    const isReply = Boolean(message.replyTo);

    return (
        <article
            className={`group relative overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md ${isRead ? 'border-gray-200' : 'border-blue-200'}`}
        >
            {/* the unread marker is a spine down the edge of the card - it survives
                any width without stealing room from the heading */}
            {!isRead && (
                <span className='absolute inset-y-0 left-0 w-1 bg-blue-500' aria-hidden='true' />
            )}

            <div className='p-5 pl-6'>
                <header className='flex items-start gap-3'>
                    <div
                        className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold ${isRead ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}
                        aria-hidden='true'
                    >
                        {initial}
                    </div>

                    <div className='min-w-0 flex-1'>
                        <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                            <h2 className='truncate text-base font-bold text-gray-900'>
                                {senderName}
                            </h2>
                            {!isRead && (
                                <span className='rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white'>
                                    New
                                </span>
                            )}
                            {isReply && (
                                <span className='inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600'>
                                    <FaReply className='text-[9px]' />
                                    Reply
                                </span>
                            )}
                        </div>

                        <p className='mt-0.5 text-sm text-gray-500'>
                            <time
                                dateTime={message.createdAt}
                                title={formatDateTime(message.createdAt)}
                            >
                                {formatRelativeTime(message.createdAt)}
                            </time>
                        </p>
                    </div>
                </header>

                {message.property?.name && (
                    <p className='mt-3 text-sm'>
                        <Link
                            href={`/properties/${message.property._id}`}
                            className='inline-flex max-w-full items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 text-gray-700 transition hover:bg-gray-100 hover:text-blue-600'
                        >
                            <FaHome className='flex-shrink-0 text-gray-400' />
                            <span className='truncate'>{message.property.name}</span>
                        </Link>
                    </p>
                )}

                {message.replyTo && (
                    <blockquote className='mt-4 rounded-lg border-l-4 border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600'>
                        <span className='mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500'>
                            <FaQuoteLeft className='text-[10px]' />
                            You wrote
                        </span>
                        {message.replyTo.body}
                    </blockquote>
                )}

                <p className='mt-4 whitespace-pre-line leading-relaxed text-gray-700'>
                    {message.body}
                </p>

                {/* contact details sit as chips rather than a list - they are things
                    to act on, not facts to read */}
                <div className='mt-4 flex flex-wrap gap-2'>
                    {message.email && (
                        <Link
                            href={`mailto:${message.email}`}
                            className='inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                        >
                            <FaEnvelope className='text-xs text-gray-400' />
                            {message.email}
                        </Link>
                    )}
                    {message.phone && (
                        <Link
                            href={`tel:${message.phone}`}
                            className='inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700'
                        >
                            <FaPhoneAlt className='text-xs text-gray-400' />
                            {message.phone}
                        </Link>
                    )}
                </div>

                {sentReply && (
                    <div className='mt-4 rounded-lg border border-green-200 bg-green-50 p-4'>
                        <p className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-700'>
                            <FaCheck className='text-[10px]' />
                            Your reply to {senderName}
                        </p>
                        <p className='mt-2 whitespace-pre-line text-gray-700'>{sentReply.body}</p>
                    </div>
                )}

                {showReplyForm && (
                    <form
                        onSubmit={handleReplySubmit}
                        className='mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4'
                    >
                        <label
                            className='mb-2 block text-sm font-bold text-gray-700'
                            htmlFor={`reply-${message._id}`}
                        >
                            Your reply
                        </label>
                        <textarea
                            className='h-28 w-full resize-y rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
                            id={`reply-${message._id}`}
                            placeholder={`Write your reply to ${senderName}`}
                            value={replyBody}
                            onChange={(e)=>setReplyBody(e.target.value)}
                            autoFocus
                        ></textarea>
                        <div className='mt-3 flex flex-wrap items-center gap-2'>
                            <button
                                type='submit'
                                disabled={isSending || !replyBody.trim()}
                                className={`${actionClass} bg-blue-600 text-white hover:bg-blue-700`}
                            >
                                <FaPaperPlane className='text-xs' />
                                {isSending ? 'Sending...' : 'Send Reply'}
                            </button>
                            <button
                                type='button'
                                onClick={()=>{
                                    setShowReplyForm(false);
                                    setReplyBody('');
                                }}
                                className={`${actionClass} bg-gray-200 text-gray-700 hover:bg-gray-300`}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                <div className='mt-5 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4'>
                    {!showReplyForm && (
                        <button
                            onClick={()=>setShowReplyForm(true)}
                            className={`${actionClass} bg-blue-600 text-white hover:bg-blue-700`}
                        >
                            <FaReply className='text-xs' />
                            {sentReply ? 'Reply Again' : 'Reply'}
                        </button>
                    )}

                    <button
                        onClick={handleReadClick}
                        className={`${actionClass} border border-gray-200 text-gray-700 hover:bg-gray-100`}
                    >
                        {isRead ? <FaUndo className='text-xs' /> : <FaCheck className='text-xs' />}
                        {isRead ? 'Mark As New' : 'Mark As Read'}
                    </button>

                    {/* the destructive action stays on the right and asks before it bites */}
                    <div className='ml-auto flex items-center gap-2'>
                        {confirmDelete ? (
                            <>
                                <span className='text-sm text-gray-500'>Delete this message?</span>
                                <button
                                    onClick={handleDeleteClick}
                                    className={`${actionClass} bg-red-600 text-white hover:bg-red-700`}
                                >
                                    Yes, delete
                                </button>
                                <button
                                    onClick={()=>setConfirmDelete(false)}
                                    className={`${actionClass} text-gray-600 hover:bg-gray-100`}
                                >
                                    Keep
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={()=>setConfirmDelete(true)}
                                aria-label='Delete message'
                                className={`${actionClass} text-gray-500 hover:bg-red-50 hover:text-red-600`}
                            >
                                <FaTrash className='text-xs' />
                                Delete
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </article>
    )
}

export default Message;
