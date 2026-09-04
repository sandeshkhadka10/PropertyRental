import AdminUsers from '@/components/AdminUsers';

const AdminUsersPage = async ({searchParams})=>{
    const params = await searchParams;

    return <AdminUsers initialRole={params?.role} />;
};

export default AdminUsersPage;
