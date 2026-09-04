'use client';
import { useState, useRef, useEffect } from 'react';
import { FaComments, FaTimes, FaPaperPlane, FaRobot } from 'react-icons/fa';

// A deliberately closed help bot: it only answers the questions listed below.
// Anything else gets the same short refusal, so it never invents an answer
// about how the site works.
const FALLBACK = "Can't response beyond this.";

const GREETING =
    "Hi! I'm the PropertyRental helper. This site is a rental marketplace for Nepal - " +
    'browse and search listings, book a stay, pay the deposit with eSewa or Khalti, ' +
    'and list your own property. Pick one of the questions below and I will answer it.';

// `keywords` is what a typed question is matched against. Keep them distinctive:
// a word that shows up in several answers (like "property") only causes the
// wrong entry to win.
const FAQS = [
    {
        id: 'about',
        question: 'What is this website about?',
        keywords: ['what is this', 'about this site', 'about this website', 'what does this site', 'purpose'],
        answer:
            'PropertyRental is a rental marketplace. Renters browse and search listings, save the ones ' +
            'they like, message the owner and book a stay online. Owners list their properties, manage ' +
            'booking requests and collect a deposit. Prices are in Nepali rupees (Rs).'
    },
    {
        id: 'pages',
        question: 'What pages does the site have?',
        keywords: ['pages', 'sections', 'navigate', 'menu'],
        answer:
            'Home, Properties (all listings), Add Property, Saved Properties, Bookings, Messages, ' +
            'Notifications and your Profile. Admins also get an Admin panel.'
    },
    {
        id: 'search',
        question: 'How do I search for a rental?',
        keywords: ['search', 'filter', 'find a rental', 'find property', 'sort'],
        answer:
            'Use the search bar on the home page to search by location and property type. On the results ' +
            'page you can narrow things down further by price range, minimum beds and baths, amenities ' +
            'and distance from a point on the map, then sort by price, newest, rating or nearest first.'
    },
    {
        id: 'book',
        question: 'How do I book a property?',
        keywords: ['book', 'booking', 'reserve', 'check in', 'check-in', 'dates'],
        answer:
            'Open a listing and use the booking form: choose your check-in and check-out dates and the ' +
            'number of guests. Dates already taken are blocked, and the total is quoted before you submit. ' +
            'The owner then confirms, cancels or completes the booking, and you can follow it under Bookings.'
    },
    {
        id: 'deposit',
        question: 'How do I pay the deposit?',
        keywords: ['deposit', 'pay', 'payment', 'esewa', 'khalti', 'wallet', 'money'],
        answer:
            'Once the owner confirms your booking, a deposit panel appears on it. The deposit is a share of ' +
            'the stay total (20% by default) and is paid through eSewa or Khalti. The rest is settled with ' +
            'the owner on arrival.'
    },
    {
        id: 'list',
        question: 'How do I list my own property?',
        keywords: ['list my', 'add property', 'add a property', 'become owner', 'rent out', 'landlord'],
        answer:
            'Sign in and use Add Property in the top menu. You fill in the type, name, description, ' +
            'location, beds and baths, rates, amenities, images and your contact details. Your listings ' +
            'stay editable from your Profile page.'
    },
    {
        id: 'saved',
        question: 'How do I save a property for later?',
        keywords: ['save', 'saved', 'bookmark', 'favourite', 'favorite'],
        answer:
            'Every listing has a bookmark button. Bookmarked listings are collected under Saved Properties ' +
            'in your profile menu. You need to be signed in for this.'
    },
    {
        id: 'contact',
        question: 'How do I contact a property owner?',
        keywords: ['contact', 'message', 'owner', 'landlord contact', 'enquiry', 'inquiry'],
        answer:
            'Each listing has a contact form. Your message goes to the owner and their reply lands in ' +
            'Messages, the envelope icon in the navbar, which shows a badge for anything unread.'
    },
    {
        id: 'account',
        question: 'Do I need an account?',
        keywords: ['account', 'sign in', 'signin', 'login', 'log in', 'register', 'sign up'],
        answer:
            'Browsing and searching are open to everyone. Booking, saving a listing, messaging an owner ' +
            'and adding a property all need an account - use Login or Register in the top right.'
    },
    {
        id: 'reviews',
        question: 'How do reviews and ratings work?',
        keywords: ['review', 'rating', 'stars', 'feedback'],
        answer:
            'Reviews come from real stays. Once your booking is over you can rate the property once, and ' +
            'that score feeds the star rating shown on the listing. Anyone can read the reviews.'
    },
    {
        id: 'notifications',
        question: 'What are the notifications for?',
        keywords: ['notification', 'bell', 'alerts'],
        answer:
            'The bell in the navbar collects updates about your activity - booking requests, confirmations ' +
            'and cancellations, payment results and new messages. The badge counts the unread ones.'
    },
    {
        id: 'theme',
        question: 'How do I switch to dark mode?',
        keywords: ['dark mode', 'light mode', 'theme', 'night mode'],
        answer:
            'Use the sun/moon button in the navbar. Your choice is remembered the next time you open the site.'
    }
];

// Very small matcher: a typed question has to actually mention something the
// answer covers, otherwise it falls through to FALLBACK.
const findAnswer = (text) => {
    const input = text.toLowerCase().trim();
    if (!input) {
        return null;
    }

    // an exact-ish hit on the suggested question itself
    const direct = FAQS.find(
        (faq) => input === faq.question.toLowerCase() || faq.question.toLowerCase().includes(input)
    );
    if (direct) {
        return direct;
    }

    // otherwise the entry with the longest matching keyword wins, so
    // "add property" beats a shorter accidental match
    let best = null;
    let bestLength = 0;
    FAQS.forEach((faq) => {
        faq.keywords.forEach((keyword) => {
            if (input.includes(keyword) && keyword.length > bestLength) {
                best = faq;
                bestLength = keyword.length;
            }
        });
    });

    return best;
};

let messageId = 0;
const nextId = () => {
    messageId += 1;
    return messageId;
};

const ChatBot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { id: nextId(), from: 'bot', text: GREETING }
    ]);

    const endRef = useRef(null);

    // keep the newest message in view, but only while the panel is open
    useEffect(() => {
        if (isOpen) {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    const respond = (question) => {
        const match = findAnswer(question);

        setMessages((previous) => [
            ...previous,
            { id: nextId(), from: 'user', text: question },
            { id: nextId(), from: 'bot', text: match ? match.answer : FALLBACK }
        ]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const question = input.trim();
        if (!question) {
            return;
        }
        respond(question);
        setInput('');
    };

    return (
        <>
            {/* launcher */}
            <button
                type='button'
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close help chat' : 'Open help chat'}
                aria-expanded={isOpen}
                className='fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 dark:bg-blue-600 dark:hover:bg-blue-500'
            >
                {isOpen ? <FaTimes className='h-6 w-6' /> : <FaComments className='h-6 w-6' />}
            </button>

            {isOpen && (
                <div className='fixed bottom-24 right-5 z-50 flex h-[32rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900'>
                    <div className='flex items-center gap-3 bg-blue-700 px-4 py-3 text-white dark:bg-blue-950'>
                        <span className='flex h-9 w-9 items-center justify-center rounded-full bg-white/15'>
                            <FaRobot className='h-4 w-4' />
                        </span>
                        <div>
                            <p className='text-sm font-semibold'>PropertyRental Helper</p>
                            <p className='text-xs text-blue-200'>Answers the questions below</p>
                        </div>
                    </div>

                    <div className='flex-1 space-y-3 overflow-y-auto px-4 py-4'>
                        {messages.map(({ id, from, text }) => (
                            <div
                                key={id}
                                className={`flex ${from === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <p
                                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                                        from === 'user'
                                            ? 'rounded-br-sm bg-blue-600 text-white'
                                            : 'rounded-bl-sm bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
                                    }`}
                                >
                                    {text}
                                </p>
                            </div>
                        ))}
                        <div ref={endRef} />
                    </div>

                    <div className='border-t border-gray-200 px-4 py-3 dark:border-gray-700'>
                        <p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'>
                            Suggested questions
                        </p>
                        <div className='flex max-h-28 flex-wrap gap-2 overflow-y-auto'>
                            {FAQS.map((faq) => (
                                <button
                                    key={faq.id}
                                    type='button'
                                    onClick={() => respond(faq.question)}
                                    className='rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-800 transition hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/40 dark:text-blue-200 dark:hover:bg-blue-900'
                                >
                                    {faq.question}
                                </button>
                            ))}
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className='flex items-center gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700'
                    >
                        <input
                            type='text'
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder='Ask one of the questions above...'
                            aria-label='Your question'
                            className='flex-1 rounded-full border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                        />
                        <button
                            type='submit'
                            aria-label='Send question'
                            className='flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-700 text-white transition hover:bg-blue-800 disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-500'
                            disabled={!input.trim()}
                        >
                            <FaPaperPlane className='h-3.5 w-3.5' />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatBot;
