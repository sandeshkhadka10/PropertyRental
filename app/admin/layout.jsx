import { redirect } from 'next/navigation';
import connectDB from '@/config/database';
import User from '@/models/User';
import { getSessionUser } from '@/utils/getSessionUser';
import AdminNav from '@/components/AdminNav';

// middleware.js already turns non-admins away at the edge using the role on
// their token. This is the second check, against the database, so the panel
// stays shut even if the token is stale or the matcher ever stops covering
// /admin. The API routes guard themselves the same way.
const AdminLayout = async ({children})=>{
    await connectDB();

    const sessionUser = await getSessionUser();
    if(!sessionUser || !sessionUser.userId){
        redirect('/');
    }

    const user = await User.findById(sessionUser.userId).select('role');
    if(!user || user.role !== 'admin'){
        redirect('/');
    }

    return (
        <section className="bg-blue-50 min-h-screen">
            <div className="container m-auto py-24 max-w-7xl">
                <div className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0">
                    <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
                    <AdminNav />
                    {children}
                </div>
            </div>
        </section>
    );
};

export default AdminLayout;
