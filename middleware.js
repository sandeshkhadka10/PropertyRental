import { withAuth } from 'next-auth/middleware';

export default withAuth(
    function middleware() {},
    {
        callbacks: {
            authorized: ({ token, req }) => {
                const { pathname } = req.nextUrl;
                const protectedPaths = [
                    '/properties/add',
                    '/profile',
                    '/properties/saved',
                    '/messages'
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