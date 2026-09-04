'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-toastify';
import { FaStar, FaRegStar } from 'react-icons/fa';
import Spinner from '@/components/Spinner';
import PropertyStatusBadge from '@/components/PropertyStatusBadge';

const TABS = [
    {key:'pending',label:'Pending'},
    {key:'approved',label:'Live'},
    {key:'rejected',label:'Rejected'},
    {key:'flagged',label:'Flagged'}
];

const PAGE_SIZE = 10;

const AdminProperties = ({initialStatus})=>{
    const [status, setStatus] = useState(
        TABS.some((tab)=> tab.key === initialStatus) ? initialStatus : 'pending'
    );
    // what the user is typing vs what has actually been searched for
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [data, setData] = useState({total:0,counts:{},properties:[]});
    const [loading, setLoading] = useState(true);
    // id of the row with a request in flight, so its buttons can be disabled
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async ()=>{
        setLoading(true);
        try{
            const params = new URLSearchParams({
                status,
                page:String(page),
                pageSize:String(PAGE_SIZE)
            });
            if(search){
                params.set('q',search);
            }

            const res = await fetch(`/api/admin/properties?${params}`);
            if(res.ok){
                setData(await res.json());
            }else{
                toast.error('Could not load listings');
            }
        }catch(error){
            console.log(error);
            toast.error('Could not load listings');
        }finally{
            setLoading(false);
        }
    },[status,page,search]);

    useEffect(()=>{
        load();
    },[load]);

    const moderate = async (property,body,successMessage)=>{
        setBusyId(property._id);
        try{
            const res = await fetch(`/api/admin/properties/${property._id}`,{
                method:'PATCH',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify(body)
            });

            if(res.ok){
                toast.success(successMessage);
                // reload rather than patching state locally, so the tab counts
                // and the row's own tab membership stay honest
                await load();
            }else{
                toast.error(await res.text() || 'Action failed');
            }
        }catch(error){
            console.log(error);
            toast.error('Action failed');
        }finally{
            setBusyId(null);
        }
    };

    const handleApprove = (property)=>
        moderate(property,{status:'approved'},'Listing approved and now live');

    const handleReject = (property)=>{
        const note = window.prompt('Why is this listing being rejected? The owner will see this.');
        if(note === null){
            return;
        }
        moderate(property,{status:'rejected',moderation_note:note},'Listing rejected');
    };

    const handleFlag = (property)=>{
        const note = window.prompt('Why is this listing being taken down? The owner will see this.');
        if(note === null){
            return;
        }
        moderate(property,{status:'flagged',moderation_note:note},'Listing flagged and hidden');
    };

    const handleRequeue = (property)=>
        moderate(property,{status:'pending'},'Listing sent back to the queue');

    const handleToggleFeatured = (property)=>
        moderate(
            property,
            {is_featured:!property.is_featured},
            property.is_featured ? 'Removed from featured' : 'Added to featured'
        );

    const handleDelete = async (property)=>{
        const confirmed = window.confirm(
            `Permanently delete "${property.name}"? Flagging hides it instead and can be undone.`
        );
        if(!confirmed){
            return;
        }

        setBusyId(property._id);
        try{
            const res = await fetch(`/api/admin/properties/${property._id}`,{
                method:'DELETE'
            });
            if(res.ok){
                toast.success('Listing deleted');
                await load();
            }else{
                toast.error('Failed to delete');
            }
        }catch(error){
            console.log(error);
            toast.error('Failed to delete');
        }finally{
            setBusyId(null);
        }
    };

    const handleSearch = (event)=>{
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const switchTab = (key)=>{
        setStatus(key);
        setPage(1);
    };

    const totalPages = Math.max(Math.ceil(data.total / PAGE_SIZE),1);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    {TABS.map((tab)=>(
                        <button
                            key={tab.key}
                            type="button"
                            onClick={()=> switchTab(tab.key)}
                            className={`rounded-md px-4 py-2 text-sm font-medium ${
                                status === tab.key
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label}
                            <span className="ml-2 text-xs opacity-80">
                                {data.counts?.[tab.key] ?? 0}
                            </span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(event)=> setSearchInput(event.target.value)}
                        placeholder="Search name or city"
                        className="border rounded-md px-3 py-2 text-sm"
                    />
                    <button
                        type="submit"
                        className="bg-gray-700 text-white rounded-md px-4 py-2 text-sm hover:bg-gray-800"
                    >
                        Search
                    </button>
                </form>
            </div>

            {loading ? (
                <Spinner loading={loading} />
            ) : data.properties.length === 0 ? (
                <p className="py-8 text-gray-600">Nothing here.</p>
            ) : (
                <div className="space-y-4">
                    {data.properties.map((property)=>{
                        const isBusy = busyId === property._id;

                        return (
                            <div
                                key={property._id}
                                className="flex flex-col md:flex-row gap-4 border border-gray-200 rounded-lg p-4"
                            >
                                {property.images?.[0] && (
                                    <Image
                                        src={property.images[0]}
                                        alt=""
                                        width={160}
                                        height={110}
                                        className="h-28 w-full md:w-40 rounded-md object-cover"
                                    />
                                )}

                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Link
                                            href={`/properties/${property._id}`}
                                            className="text-lg font-semibold hover:text-blue-700"
                                        >
                                            {property.name}
                                        </Link>
                                        <PropertyStatusBadge status={property.status} />
                                        {property.is_featured && (
                                            <span className="inline-block rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                                                Featured
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-600 mt-1">
                                        {property.type} &middot; {property.location?.city} {property.location?.state}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Owner: {property.owner?.username || 'Unknown'}
                                        {property.owner?.email ? ` (${property.owner.email})` : ''}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Submitted {new Date(property.createdAt).toLocaleDateString()}
                                    </p>

                                    {property.moderation_note && (
                                        <p className="mt-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
                                            Note to owner: {property.moderation_note}
                                        </p>
                                    )}

                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {property.status && property.status !== 'approved' && (
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={()=> handleApprove(property)}
                                                className="bg-green-600 text-white rounded-md px-3 py-2 text-sm hover:bg-green-700 disabled:opacity-50"
                                            >
                                                Approve
                                            </button>
                                        )}

                                        {property.status === 'pending' && (
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={()=> handleReject(property)}
                                                className="bg-red-600 text-white rounded-md px-3 py-2 text-sm hover:bg-red-700 disabled:opacity-50"
                                            >
                                                Reject
                                            </button>
                                        )}

                                        {(!property.status || property.status === 'approved') && (
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={()=> handleFlag(property)}
                                                className="bg-orange-600 text-white rounded-md px-3 py-2 text-sm hover:bg-orange-700 disabled:opacity-50"
                                            >
                                                Flag &amp; hide
                                            </button>
                                        )}

                                        {property.status && property.status !== 'pending' && (
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={()=> handleRequeue(property)}
                                                className="bg-gray-200 text-gray-800 rounded-md px-3 py-2 text-sm hover:bg-gray-300 disabled:opacity-50"
                                            >
                                                Back to queue
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={()=> handleToggleFeatured(property)}
                                            title={property.is_featured
                                                ? 'Remove from the featured strip'
                                                : 'Show on the featured strip'}
                                            className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
                                        >
                                            {property.is_featured
                                                ? <FaStar className="text-yellow-500" />
                                                : <FaRegStar />}
                                            {property.is_featured ? 'Unfeature' : 'Feature'}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isBusy}
                                            onClick={()=> handleDelete(property)}
                                            className="border border-red-300 text-red-700 rounded-md px-3 py-2 text-sm hover:bg-red-50 disabled:opacity-50"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {data.total > PAGE_SIZE && (
                <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={()=> setPage((current)=> current - 1)}
                        className="border rounded-md px-4 py-2 text-sm disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={()=> setPage((current)=> current + 1)}
                        className="border rounded-md px-4 py-2 text-sm disabled:opacity-40"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default AdminProperties;
