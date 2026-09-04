'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Spinner from '@/components/Spinner';

const Tile = ({label,value,hint,href,accent})=>{
    const body = (
        <div className={`rounded-lg border p-5 h-full ${accent || 'border-gray-200 bg-white'}`}>
            <p className="text-sm text-gray-600">{label}</p>
            <p className="mt-1 text-3xl font-bold">{value}</p>
            {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
        </div>
    );

    return href ? <Link href={href} className="block hover:opacity-90">{body}</Link> : body;
};

const AdminDashboard = ()=>{
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        const getStats = async ()=>{
            try{
                const res = await fetch('/api/admin/stats');
                if(res.ok){
                    setStats(await res.json());
                }
            }catch(error){
                console.log(error);
            }finally{
                setLoading(false);
            }
        };
        getStats();
    },[]);

    if(loading){
        return <Spinner loading={loading} />;
    }

    if(!stats){
        return <p className="text-red-600">Could not load the dashboard.</p>;
    }

    return (
        <div>
            <h2 className="text-xl font-semibold mb-4">Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Tile
                    label="Waiting for review"
                    value={stats.properties.pending}
                    hint="Not visible to anyone but their owner"
                    href="/admin/properties?status=pending"
                    accent={stats.properties.pending > 0
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-gray-200 bg-white'}
                />
                <Tile
                    label="Live"
                    value={stats.properties.live}
                    hint={`${stats.properties.featured} featured`}
                    href="/admin/properties?status=approved"
                />
                <Tile
                    label="Rejected"
                    value={stats.properties.rejected}
                    href="/admin/properties?status=rejected"
                />
                <Tile
                    label="Flagged"
                    value={stats.properties.flagged}
                    hint="Taken down after going live"
                    href="/admin/properties?status=flagged"
                />
            </div>

            <h2 className="text-xl font-semibold mb-4">Users</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Tile label="Total" value={stats.users.total} href="/admin/users" />
                <Tile label="Tenants" value={stats.users.tenant} href="/admin/users?role=tenant" />
                <Tile label="Landlords" value={stats.users.landlord} href="/admin/users?role=landlord" />
                <Tile label="Admins" value={stats.users.admin} href="/admin/users?role=admin" />
            </div>
        </div>
    );
};

export default AdminDashboard;
