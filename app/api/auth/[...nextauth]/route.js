import {authOptions} from '@/utils/authOptions.js';
import NextAuth from 'next-auth';

// Create NextAuth API handler using your custom options
const handler = NextAuth(authOptions);

// Export for GET and POST methods — Next.js will call them automatically
export {handler as GET, handler as POST};

// So whenever a request hits /api/auth/..., NextAuth handles it automatically.