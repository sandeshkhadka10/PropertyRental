'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { signIn, getProviders, useSession } from 'next-auth/react';
import { FaGoogle } from 'react-icons/fa';

// next-auth sends people here with ?error=... when a sign in attempt fails.
// The codes are terse, so they get turned into something readable.
const errorMessages = {
    OAuthAccountNotLinked:
        'That email is already registered with a different sign in method.',
    AccessDenied: 'Access was denied. Please try again with another account.',
    Configuration: 'Sign in is not configured correctly. Please contact support.',
    Verification: 'That sign in link is no longer valid. Please try again.'
};

// Anything the middleware protects can land here, so the heading explains why
// the person was interrupted rather than just saying "sign in".
const reasons = {
    '/properties/add': 'You need an account before you can list a property.',
    '/profile': 'Sign in to see your profile and your listings.',
    '/properties/saved': 'Sign in to see the properties you have saved.',
    '/messages': 'Sign in to read your messages.',
    '/notifications': 'Sign in to see your notifications.',
    '/bookings': 'Sign in to see your bookings.'
};

const LoginPanel = () => {
    const searchParams = useSearchParams();
    const { data: session } = useSession();

    // NextAuth puts the page the person was heading for in callbackUrl, so
    // signing in drops them exactly where they were going.
    const callbackUrl = searchParams.get('callbackUrl') || '/';
    const error = searchParams.get('error');

    const [providers, setProviders] = useState(null);

    useEffect(() => {
        const setAuthProviders = async () => {
            const res = await getProviders();
            setProviders(res);
        };
        setAuthProviders();
    }, []);

    // the reason lookup needs the path on its own, callbackUrl can be absolute
    // and can carry a query string of its own
    let reason = null;
    try {
        const { pathname } = new URL(callbackUrl, 'http://localhost');
        reason = reasons[pathname] || null;
    } catch {
        reason = null;
    }

    return (
        <div className='bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0'>
            <h1 className='text-3xl text-center font-semibold mb-2'>
                Login or Register
            </h1>
            <p className='text-center text-gray-600 mb-6'>
                {reason || 'Sign in to continue.'}
            </p>

            {error && (
                <div className='bg-red-50 border border-red-200 text-red-700 rounded-md px-4 py-3 mb-6 text-sm'>
                    {errorMessages[error] ||
                        'Something went wrong while signing in. Please try again.'}
                </div>
            )}

            {session ? (
                // signing in from another tab, or coming back to /login by hand
                <div className='text-center'>
                    <p className='text-gray-700 mb-4'>
                        You are already signed in as{' '}
                        <span className='font-semibold'>{session.user?.email}</span>.
                    </p>
                    <Link
                        href={callbackUrl}
                        className='inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full'
                    >
                        Continue
                    </Link>
                </div>
            ) : (
                <div className='flex flex-col items-center'>
                    {providers ? (
                        Object.values(providers).map((provider) => (
                            <button
                                key={provider.id}
                                onClick={() => signIn(provider.id, { callbackUrl })}
                                className='flex items-center justify-center w-full bg-gray-700 hover:bg-gray-900 text-white font-bold py-3 px-4 rounded-md'
                            >
                                <FaGoogle className='text-white mr-2' />
                                <span>Continue with {provider.name}</span>
                            </button>
                        ))
                    ) : (
                        <p className='text-gray-500'>Loading sign in options...</p>
                    )}

                    <p className='text-gray-500 text-sm mt-6 text-center'>
                        New here? Signing in with Google creates your account
                        automatically. You start as a tenant and can switch to a
                        landlord account from your profile whenever you want to list a
                        property.
                    </p>
                </div>
            )}

            <p className='mt-8 text-sm text-center'>
                <Link href='/properties' className='text-blue-500 hover:text-blue-600'>
                    Browse properties instead
                </Link>
            </p>
        </div>
    );
};

export default LoginPanel;
