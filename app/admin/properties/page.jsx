import AdminProperties from '@/components/AdminProperties';

// The dashboard tiles link straight to a tab, e.g. /admin/properties?status=flagged.
// Reading it here rather than with useSearchParams keeps the client component
// free of a Suspense boundary.
const AdminPropertiesPage = async ({searchParams})=>{
    const params = await searchParams;

    return <AdminProperties initialStatus={params?.status} />;
};

export default AdminPropertiesPage;
