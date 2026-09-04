import Image from 'next/image';
import Link from 'next/link';
import FooterLogo from '@/assets/images/logo-white.png';
import {
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
    FaEnvelope,
    FaPhone,
    FaLocationDot,
    FaArrowRight,
} from 'react-icons/fa6';

// only routes that actually exist are linked here - the old footer pointed at
// /terms, which 404s
const exploreLinks = [
    { href: '/properties', label: 'Browse Properties' },
    { href: '/properties/search-results?location=&propertyType=All', label: 'Search Rentals' },
    { href: '/properties/add', label: 'List a Property' },
    { href: '/properties/saved', label: 'Saved Properties' },
];

const accountLinks = [
    { href: '/profile', label: 'My Profile' },
    { href: '/bookings', label: 'My Bookings' },
    { href: '/messages', label: 'Messages' },
    { href: '/notifications', label: 'Notifications' },
];

const socialLinks = [
    { href: 'https://facebook.com', label: 'Facebook', Icon: FaFacebookF },
    { href: 'https://instagram.com', label: 'Instagram', Icon: FaInstagram },
    { href: 'https://linkedin.com', label: 'LinkedIn', Icon: FaLinkedinIn },
];

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className='mt-20 bg-gradient-to-b from-blue-800 to-blue-900 text-blue-100 dark:from-blue-950 dark:to-slate-950'>
            <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
                {/* top: brand + link columns */}
                <div className='grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:py-16'>
                    <div className='sm:col-span-2 lg:col-span-1'>
                        <Link href='/' className='flex items-center gap-2'>
                            <Image
                                className='h-10 w-auto'
                                src={FooterLogo}
                                alt='PropertyRental'
                            />
                            <span className='text-xl font-bold text-white'>
                                PropertyRental
                            </span>
                        </Link>

                        <p className='mt-4 max-w-sm text-sm leading-relaxed text-blue-200'>
                            Find the perfect rental, book it with confidence and manage
                            everything in one place - from viewing requests to deposits.
                        </p>

                        <div className='mt-6 flex gap-3'>
                            {socialLinks.map(({ href, label, Icon }) => (
                                <a
                                    key={label}
                                    href={href}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    aria-label={label}
                                    className='flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-blue-800 dark:hover:bg-white dark:hover:text-blue-950'
                                >
                                    <Icon className='h-4 w-4' />
                                </a>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className='text-sm font-semibold uppercase tracking-wider text-white'>
                            Explore
                        </h3>
                        <ul className='mt-4 space-y-3 text-sm'>
                            {exploreLinks.map(({ href, label }) => (
                                <li key={label}>
                                    <Link
                                        href={href}
                                        className='text-blue-200 transition hover:text-white'
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className='text-sm font-semibold uppercase tracking-wider text-white'>
                            Your Account
                        </h3>
                        <ul className='mt-4 space-y-3 text-sm'>
                            {accountLinks.map(({ href, label }) => (
                                <li key={label}>
                                    <Link
                                        href={href}
                                        className='text-blue-200 transition hover:text-white'
                                    >
                                        {label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className='text-sm font-semibold uppercase tracking-wider text-white'>
                            Get in Touch
                        </h3>
                        <ul className='mt-4 space-y-3 text-sm text-blue-200'>
                            <li className='flex items-start gap-3'>
                                <FaLocationDot className='mt-1 h-4 w-4 flex-shrink-0 text-blue-300' />
                                <span>Kathmandu, Nepal</span>
                            </li>
                            <li className='flex items-start gap-3'>
                                <FaEnvelope className='mt-1 h-4 w-4 flex-shrink-0 text-blue-300' />
                                <a
                                    href='mailto:support@propertyrental.com'
                                    className='transition hover:text-white'
                                >
                                    support@propertyrental.com
                                </a>
                            </li>
                            <li className='flex items-start gap-3'>
                                <FaPhone className='mt-1 h-4 w-4 flex-shrink-0 text-blue-300' />
                                <a
                                    href='tel:+9771234567'
                                    className='transition hover:text-white'
                                >
                                    +977 1 234567
                                </a>
                            </li>
                        </ul>

                        <Link
                            href='/properties/add'
                            className='mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-800 transition hover:bg-blue-100 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400'
                        >
                            List Your Property
                            <FaArrowRight className='h-3 w-3' />
                        </Link>
                    </div>
                </div>

                {/* bottom bar */}
                <div className='flex flex-col items-center justify-between gap-3 border-t border-white/15 py-6 text-sm text-blue-300 md:flex-row'>
                    <p>
                        &copy; {currentYear} PropertyRental. All rights reserved.
                    </p>
                    <p>Built for renters and landlords in Nepal.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
