import PropertyFormSearch from '@/components/PropertyFormSearch';
import Properties from '@/components/Properties';

const PropertiesPage = async () => {
    return (
        <>
           {/* Displaying Search Option All Time  */}
            <section className='bg-blue-700 py-4'>
                <div className='max-w-7xl mx-auto px-4 flex flex-col items-start sm:px-6 lg:px-8'>
                    <PropertyFormSearch />
                </div>
            </section>
            {
                <Properties/>
            }
        </>
    )
}

export default PropertiesPage;

