'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import profileDefault from '@/assets/images/profile.png';
import Spinner from '@/components/Spinner';

const ROLE_FILTERS = [
    {key:'',label:'All'},
    {key:'tenant',label:'Tenants'},
    {key:'landlord',label:'Landlords'},
    {key:'admin',label:'Admins'}
];

const ROLES = ['tenant','landlord','admin'];
const PAGE_SIZE = 20;

const AdminUsers = ({initialRole})=>{
    const {data:session} = useSession();
    const currentUserId = session?.user?.id;

    const [role, setRole] = useState(
        ROLES.includes(initialRole) ? initialRole : ''
    );
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const [data, setData] = useState({total:0,users:[]});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const load = useCallback(async ()=>{
        setLoading(true);
        try{
            const params = new URLSearchParams({
                page:String(page),
                pageSize:String(PAGE_SIZE)
            });
            if(role){
                params.set('role',role);
            }
            if(search){
                params.set('q',search);
            }

            const res = await fetch(`/api/admin/users?${params}`);
            if(res.ok){
                setData(await res.json());
            }else{
                toast.error('Could not load users');
            }
        }catch(error){
            console.log(error);
            toast.error('Could not load users');
        }finally{
            setLoading(false);
        }
    },[role,page,search]);

    useEffect(()=>{
        load();
    },[load]);

    const handleRoleChange = async (user,nextRole)=>{
        if(nextRole === user.role){
            return;
        }

        setBusyId(user._id);
        try{
            const res = await fetch(`/api/admin/users/${user._id}`,{
                method:'PATCH',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({role:nextRole})
            });

            if(res.ok){
                toast.success(`${user.username} is now a ${nextRole}`);
                setData((current)=>({
                    ...current,
                    users:current.users.map((row)=>
                        row._id === user._id ? {...row,role:nextRole} : row
                    )
                }));
            }else{
                toast.error(await res.text() || 'Could not change the role');
            }
        }catch(error){
            console.log(error);
            toast.error('Could not change the role');
        }finally{
            setBusyId(null);
        }
    };

    const handleSearch = (event)=>{
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    };

    const totalPages = Math.max(Math.ceil(data.total / PAGE_SIZE),1);

    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div className="flex flex-wrap gap-2">
                    {ROLE_FILTERS.map((filter)=>(
                        <button
                            key={filter.key || 'all'}
                            type="button"
                            onClick={()=>{
                                setRole(filter.key);
                                setPage(1);
                            }}
                            className={`rounded-md px-4 py-2 text-sm font-medium ${
                                role === filter.key
                                    ? 'bg-blue-700 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(event)=> setSearchInput(event.target.value)}
                        placeholder="Search name or email"
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
            ) : data.users.length === 0 ? (
                <p className="py-8 text-gray-600">No users match that.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-600 border-b">
                                <th className="py-2 pr-4">User</th>
                                <th className="py-2 pr-4">Joined</th>
                                <th className="py-2 pr-4">Listings</th>
                                <th className="py-2 pr-4">Saved</th>
                                <th className="py-2">Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.users.map((user)=>{
                                const isSelf = user._id === currentUserId;

                                return (
                                    <tr key={user._id} className="border-b last:border-0">
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={user.image || profileDefault}
                                                    alt=""
                                                    width={36}
                                                    height={36}
                                                    className="h-9 w-9 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="font-medium">
                                                        {user.username}
                                                        {isSelf && (
                                                            <span className="ml-2 text-xs text-gray-500">(you)</span>
                                                        )}
                                                    </p>
                                                    <p className="text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-gray-600">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="py-3 pr-4">{user.listingCount}</td>
                                        <td className="py-3 pr-4">{user.bookmarkCount}</td>
                                        <td className="py-3">
                                            <select
                                                value={user.role}
                                                disabled={isSelf || busyId === user._id}
                                                onChange={(event)=> handleRoleChange(user,event.target.value)}
                                                // an admin cannot demote themselves, which would
                                                // otherwise be a one-click way to lock the panel
                                                title={isSelf
                                                    ? 'Another admin has to change your role'
                                                    : undefined}
                                                className="border rounded-md px-2 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {ROLES.map((option)=>(
                                                    <option key={option} value={option}>
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
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

export default AdminUsers;
