'use client';
import { useState } from 'react';
import Image from 'next/image';
import logo from '@/assets/images/logo-white.png';
import profileDefault from '@/assets/images/profile.png';
import Link from 'next/link';
import { FaGoogle, FaEnvelope } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import UnreadMessageCount from '@/components/UnreadMessageCount';
import NotificationCount from '@/components/NotificationCount';
import ThemeToggle from '@/components/ThemeToggle';

const Navbar = () => {
    // useSession-> to access the session data (who's logged in, user info etc)
    // and track authentication status
    const { data: session } = useSession();

    // using optional chaining to access nested object properties
    const profileImage = session?.user?.image;

    // the session callback reads the role from the database, so this is only a
    // display decision - /admin is guarded by middleware and by the routes
    const isAdmin = session?.user?.role === 'admin';

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const pathname = usePathname();
    // console.log(pathname);

    // the list of auth providers is fetched by the /login page now, this only
    // needs a link over to it

    return (
        <nav className='bg-blue-700 border-b border-blue-500 dark:bg-blue-950 dark:border-blue-900'>
            <div className='mx-auto max-w-7xl px-2 sm:px-6 lg:px-8'>
                <div className='relative flex h-20 items-center justify-between'>
                    <div className='absolute inset-y-0 left-0 flex items-center md:hidden'>
                        {/* <!-- Mobile menu button--> */}
                        <button
                            type='button'
                            id='mobile-dropdown-button'
                            className='relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white'
                            aria-controls='mobile-menu'
                            aria-expanded='false'
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            <span className='absolute -inset-0.5'></span>
                            <span className='sr-only'>Open main menu</span>
                            <svg
                                className='block h-6 w-6'
                                fill='none'
                                viewBox='0 0 24 24'
                                strokeWidth='1.5'
                                stroke='currentColor'
                                aria-hidden='true'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    d='M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
                                />
                            </svg>
                        </button>
                    </div>

                    <div className='flex flex-1 items-center justify-center md:items-stretch md:justify-start'>
                        {/* <!-- Logo --> */}
                        <Link className='flex flex-shrink-0 items-center' href='/'>
                            <Image className='h-10 w-auto' src={logo} alt='PropertyPulse' />

                            <span className='hidden md:block text-white text-2xl font-bold ml-2'>
                                PropertyRental
                            </span>
                        </Link>
                        {/* <!-- Desktop Menu Hidden below md screens --> */}
                        <div className='hidden md:ml-6 md:block'>
                            <div className='flex space-x-2'>
                                <Link
                                    href='/'
                                    className={`${pathname === '/' ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                                >
                                    Home
                                </Link>
                                <Link
                                    href='/properties'
                                    className={`${pathname === '/properties' ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                                >
                                    Properties
                                </Link>
                                {/* shown signed out as well - the middleware sends
                                    anonymous visitors to /login and brings them back
                                    here once they have signed in */}
                                <Link
                                    href='/properties/add'
                                    className={`${pathname === '/properties/add' ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                                >
                                    Add Property
                                </Link>
                                {session && (
                                    <Link
                                        href='/bookings'
                                        className={`${pathname === '/bookings' ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                                    >
                                        Bookings
                                    </Link>
                                )}
                                {isAdmin && (
                                    <Link
                                        href='/admin'
                                        className={`${pathname.startsWith('/admin') ? 'bg-black' : ''} text-white hover:bg-gray-900 hover:text-white rounded-md px-3 py-2`}
                                    >
                                        Admin
                                    </Link>
                                )}

                            </div>
                        </div>
                    </div>

                    {/* <!-- Right Side Menu --> */}
                    {/* one container for both signed in and signed out so the
                        theme toggle keeps its place either way */}
                    <div className='absolute inset-y-0 right-0 flex items-center gap-3 pr-2 md:static md:inset-auto md:ml-6 md:pr-0'>
                        <ThemeToggle />

                        {!session && (
                            /* the sign in screen lives at /login now, so the
                               provider buttons are all in one place */
                            <Link
                                href='/login'
                                className='hidden md:flex items-center text-white bg-gray-700 hover:bg-gray-900 hover:text-white rounded-md px-3 py-2'
                            >
                                <FaGoogle className='text-white mr-2' />
                                <span>Login or Register</span>
                            </Link>
                        )}

                        {session && (
                        <>
                            {/* Messages keeps the envelope, the bell next to it
                                is what actually carries notifications now */}
                            <Link href='/messages' className='relative group'>
                                <button
                                    type='button'
                                    className='relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800'
                                >
                                    <span className='absolute -inset-1.5'></span>
                                    <span className='sr-only'>View messages</span>
                                    <FaEnvelope className='h-6 w-6 p-0.5' />
                                </button>
                                <UnreadMessageCount session={session}/>
                            </Link>
                            <Link href='/notifications' className='relative group'>
                                <button
                                    type='button'
                                    className='relative rounded-full bg-gray-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800'
                                >
                                    <span className='absolute -inset-1.5'></span>
                                    <span className='sr-only'>View notifications</span>
                                    <svg
                                        className='h-6 w-6'
                                        fill='none'
                                        viewBox='0 0 24 24'
                                        strokeWidth='1.5'
                                        stroke='currentColor'
                                        aria-hidden='true'
                                    >
                                        <path
                                            strokeLinecap='round'
                                            strokeLinejoin='round'
                                            d='M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0'
                                        />
                                    </svg>
                                </button>
                                <NotificationCount session={session}/>
                            </Link>
                            {/* <!-- Profile dropdown button --> */}
                            <div className='relative'>
                                <div>
                                    <button
                                        type='button'
                                        className='relative flex rounded-full bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800'
                                        id='user-menu-button'
                                        aria-expanded='false'
                                        aria-haspopup='true'
                                        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    >
                                        <span className='absolute -inset-1.5'></span>
                                        <span className='sr-only'>Open user menu</span>
                                        <Image
                                            className='h-8 w-8 rounded-full'
                                            src={profileImage}
                                            alt=''
                                            width={0}
                                            height={0}
                                        />
                                    </button>
                                </div>

                                {/* <!-- Profile dropdown --> */}
                                {isProfileMenuOpen && (
                                    <div
                                        id='user-menu'
                                        className='absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none'
                                        role='menu'
                                        aria-orientation='vertical'
                                        aria-labelledby='user-menu-button'
                                        tabIndex='-1'
                                    >
                                        <Link
                                            href='/profile'
                                            className='block px-4 py-2 text-sm text-gray-700'
                                            role='menuitem'
                                            tabIndex='-1'
                                            id='user-menu-item-0'
                                            onClick={()=>{
                                                setIsProfileMenuOpen(false);
                                            }}
                                        >
                                            Your Profile
                                        </Link>
                                        <Link
                                            href='/properties/saved'
                                            className='block px-4 py-2 text-sm text-gray-700'
                                            role='menuitem'
                                            tabIndex='-1'
                                            id='user-menu-item-2'
                                            onClick={()=>{
                                                setIsProfileMenuOpen(false);
                                            }}
                                        >
                                            Saved Properties
                                        </Link>
                                        {isAdmin && (
                                            <Link
                                                href='/admin'
                                                className='block px-4 py-2 text-sm text-gray-700'
                                                role='menuitem'
                                                tabIndex='-1'
                                                id='user-menu-item-3'
                                                onClick={()=>{
                                                    setIsProfileMenuOpen(false);
                                                }}
                                            >
                                                Admin Panel
                                            </Link>
                                        )}
                                        <button
                                            href='#'
                                            className='block px-4 py-2 text-sm text-gray-700'
                                            role='menuitem'
                                            tabIndex='-1'
                                            id='user-menu-item-2'
                                            onClick={()=>{
                                                setIsProfileMenuOpen(false);
                                                // Without an explicit callback next-auth returns to the
                                                // current page, which the middleware then bounces to the
                                                // sign-in screen when it was a protected one.
                                                signOut({ callbackUrl: '/' });
                                            }}
                                        >
                                            Sign Out
                                        </button>
                                    </div>
                                )}

                            </div>
                        </>
                        )}
                    </div>

                </div>
            </div>

            {/* <!-- Mobile menu, show/hide based on menu state. --> */}
            {isMobileMenuOpen && (
                <div id='mobile-menu'>
                    <div className='space-y-1 px-2 pb-3 pt-2'>
                        <Link
                            href='/'
                            className={`${pathname === '/' ? 'bg-black' : ''} text-white block rounded-md px-3 py-2 text-base font-medium`}
                        >
                            Home
                        </Link>
                        <Link
                            href='/properties'
                            className={`${pathname === '/properties' ? 'bg-black' : ''} text-white block rounded-md px-3 py-2 text-base font-medium`}
                        >
                            Properties
                        </Link>
                        <Link
                            href='/properties/add'
                            className={`${pathname === '/properties/add' ? 'bg-black' : ''} text-white block rounded-md px-3 py-2 text-base font-medium`}
                        >
                            Add Property
                        </Link>
                        {session && (
                            <Link
                                href='/bookings'
                                className={`${pathname === '/bookings' ? 'bg-black' : ''} text-white block rounded-md px-3 py-2 text-base font-medium`}
                            >
                                Bookings
                            </Link>
                        )}
                        {isAdmin && (
                            <Link
                                href='/admin'
                                className={`${pathname.startsWith('/admin') ? 'bg-black' : ''} text-white block rounded-md px-3 py-2 text-base font-medium`}
                            >
                                Admin
                            </Link>
                        )}
                        {!session && (
                            <Link
                                href='/login'
                                className='flex items-center text-white bg-gray-700 hover:bg-gray-900 hover:text-white rounded-md px-3 py-2'
                            >
                                <FaGoogle className='text-white mr-2' />
                                <span>Login or Register</span>
                            </Link>
                        )}

                    </div>
                </div>
            )}

        </nav>
    )
}

export default Navbar;