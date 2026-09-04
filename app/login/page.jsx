import { Suspense } from 'react';
import LoginPanel from '@/components/LoginPanel';

// authOptions and middleware.js both point next-auth's signIn page here, so an
// anonymous visit to a protected page such as /properties/add ends up on this
// screen instead of the default next-auth one.
export const metadata = {
    title: 'Login or Register'
};

const LoginPage = () => {
    return (
        <section className='bg-blue-50 min-h-[60vh]'>
            <div className='container m-auto max-w-lg py-24'>
                {/* LoginPanel reads callbackUrl from the query string */}
                <Suspense
                    fallback={
                        <div className='bg-white px-6 py-8 m-4 md:m-0 shadow-md rounded-md border text-center text-gray-500'>
                            Loading...
                        </div>
                    }
                >
                    <LoginPanel />
                </Suspense>
            </div>
        </section>
    );
};

export default LoginPage;
