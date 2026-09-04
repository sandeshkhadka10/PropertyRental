'use client';
import { useState, useEffect, useMemo } from 'react';
import { FaEnvelopeOpenText, FaInbox, FaSearch, FaTimes } from 'react-icons/fa';
import Spinner from '@/components/Spinner';
import Message from '@/components/Message';

const Messages = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');

    useEffect(() => {
        const getMessages = async () => {
            try {
                const res = await fetch('/api/messages');
                if (res.status === 200) {
                    const data = await res.json();
                    setMessages(data);
                }
            } catch (error) {
                console.log('Error fetching messages: ', error);
            } finally {
                setLoading(false);
            }
        }
        getMessages();
    }, []);

    // each card owns its own read state; this only keeps the list's copy in step
    // so the tab counts do not drift as messages are read
    const handleReadChange = (id, read) => {
        setMessages((current) => current.map((message) => (
            message._id === id ? { ...message, read } : message
        )));
    };

    const handleDeleted = (id) => {
        setMessages((current) => current.filter((message) => message._id !== id));
    };

    const unread = messages.filter((message) => !message.read).length;

    // unread first, newest first inside each group - the thing still waiting on
    // an answer is the thing worth showing at the top
    const ordered = useMemo(() => (
        [...messages].sort((a, b) => (
            (a.read === b.read)
                ? new Date(b.createdAt) - new Date(a.createdAt)
                : (a.read ? 1 : -1)
        ))
    ), [messages]);

    const shown = useMemo(() => {
        const search = query.trim().toLowerCase();

        return ordered.filter((message) => {
            if (filter === 'unread' && message.read) return false;
            if (filter === 'read' && !message.read) return false;
            if (!search) return true;

            return [
                message.sender?.username,
                message.property?.name,
                message.body,
                message.email,
                message.phone
            ].some((field) => field?.toLowerCase().includes(search));
        });
    }, [ordered, filter, query]);

    const tabs = [
        { key: 'all', label: 'All', count: messages.length },
        { key: 'unread', label: 'Unread', count: unread },
        { key: 'read', label: 'Read', count: messages.length - unread }
    ];

    const tabClass = (active) =>
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
                            <div className='flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600'>
                                <FaInbox className='text-xl' />
                            </div>
                            <div className='min-w-0 flex-1'>
                                <h1 className="text-2xl font-bold text-gray-900 md:text-3xl">Your Messages</h1>
                                <p className='mt-1 text-sm text-gray-500'>
                                    {messages.length === 0
                                        ? 'Enquiries about your listings will land here'
                                        : unread > 0
                                            ? `${unread} unread of ${messages.length} message${messages.length > 1 ? 's' : ''}`
                                            : `${messages.length} message${messages.length > 1 ? 's' : ''}, all read`}
                                </p>
                            </div>
                        </header>

                        {messages.length > 0 && (
                            <div className='flex flex-wrap items-center justify-between gap-3 py-5'>
                                <div className='flex flex-wrap items-center gap-1 rounded-xl bg-gray-50 p-1'>
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setFilter(tab.key)}
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

                                <div className='relative w-full sm:w-64'>
                                    <FaSearch className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400' />
                                    <input
                                        type='search'
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        placeholder='Search messages'
                                        aria-label='Search messages'
                                        className='w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30'
                                    />
                                    {query && (
                                        <button
                                            onClick={() => setQuery('')}
                                            aria-label='Clear search'
                                            className='absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600'
                                        >
                                            <FaTimes className='text-xs' />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {messages.length === 0 ? (
                                <div className='py-14 text-center'>
                                    <div className='mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400'>
                                        <FaEnvelopeOpenText className='text-2xl' />
                                    </div>
                                    <p className='mt-4 text-lg font-semibold text-gray-700'>No messages yet</p>
                                    <p className='mt-1 text-sm text-gray-500'>
                                        When someone enquires about one of your properties, it will show up here.
                                    </p>
                                </div>
                            ) : shown.length === 0 ? (
                                <div className='py-12 text-center'>
                                    <p className='text-gray-600'>Nothing matches this view.</p>
                                    <button
                                        onClick={() => { setFilter('all'); setQuery(''); }}
                                        className='mt-3 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100'
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            ) : (
                                shown.map((message) => (
                                    <Message
                                        key={message._id}
                                        message={message}
                                        onReadChange={handleReadChange}
                                        onDeleted={handleDeleted}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </section>
        )

}

export default Messages;
