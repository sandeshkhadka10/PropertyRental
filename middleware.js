import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
    // Runs only once `authorized` below has let the request through, so at this
    // point anyone on an /admin path is at least signed in. Non-admins are sent
    // home rather than to the sign-in screen, which would be a dead end for
    // them. The API routes under /api/admin re-check the role against the
    // database, this is only the navigation guard.
    function middleware(req) {
        const { pathname } = req.nextUrl;

        if (pathname === '/admin' || pathname.startsWith('/admin/')) {
            if (req.nextauth?.token?.role !== 'admin') {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        return NextResponse.next();
    },
    {
        // withAuth does not read authOptions, so the sign in page has to be
        // repeated here. Without it an anonymous request to a protected path
        // is bounced to the default /api/auth/signin screen.
        pages: {
            signIn: '/login',
            error: '/login'
        },
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;
                const protectedPaths = [
                    '/properties/add',
                    '/profile',
                    '/properties/saved',
                    '/messages',
                    '/notifications',
                    '/bookings',
                    '/admin'
                ];

                const isProtected = protectedPaths.some((path) =>
                    pathname === path || pathname.startsWith(`${path}/`)
                );

                if (!isProtected) {
                    return true;
                }

                return !!token;
            }
        }
    }
);

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
