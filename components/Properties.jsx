'use client';
import {useState,useEffect} from 'react';
import PropertyCard from '@/components/PropertyCard.jsx';
import Spinner from '@/components/Spinner';
import Pagination from '@/components/Pagination';

const Properties = () => {
    const [properties,setProperties] = useState([]);
    const [loading,setLoading] = useState(true);

    // implementing pagination in the frontend
    const [page,setPage] = useState(1);
    const [pageSize,setPageSize] = useState(3);
    const [totalItems,setTotalItems] = useState(0);

    // the server does the ordering, this only says which one to ask for
    const [sort,setSort] = useState('newest');

    useEffect(()=>{
        const fetchProperties = async()=>{
            try{
                const res = await fetch(`/api/properties?page=${page}&pageSize=${pageSize}&sort=${sort}`);
                if(!res.ok){
                    throw new Error('Failed to fetch data');
                }
                const data = await res.json();
                setProperties(data.properties);
                setTotalItems(data.total);
            }catch(error){
                console.log(error);
            }finally{
                setLoading(false);
            }
        };
        fetchProperties();
    },[page,pageSize,sort]);

    // updates the current page state
    const handlePageChange = (newPage) =>{
        setPage(newPage);
    };

    // a re-sorted list makes the page you were on meaningless, so go back to
    // the first one rather than leaving the visitor stranded mid-way
    const handleSortChange = (e) =>{
        setSort(e.target.value);
        setPage(1);
    };

    return loading ? (<Spinner/>) : (
        <section className="px-4 py-6">
            <div className="container-xl lg:container m-auto px-4 py-6">
                <div className="flex items-center justify-end mb-6">
                    <label htmlFor="sort" className="text-gray-700 text-sm mr-2">
                        Sort by:
                    </label>
                    <select
                        id="sort"
                        value={sort}
                        onChange={handleSortChange}
                        className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:shadow-outline"
                    >
                        <option value="newest">Newest</option>
                        <option value="rating">Top rated</option>
                    </select>
                </div>
                {properties.length === 0 ?
                    (
                        <p>No properties found</p>
                    ) :
                    (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {properties.map((property) => (
                                <PropertyCard key={property._id} property={property} />
                            ))}
                        </div>
                    )}
            </div>
            <Pagination page={page} pageSize={pageSize} totalItems={totalItems} onPageChange={handlePageChange}/>
        </section>
    )
}

export default Properties;