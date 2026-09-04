'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
    {href:'/admin',label:'Overview'},
    {href:'/admin/properties',label:'Listings'},
    {href:'/admin/users',label:'Users'}
];

const AdminNav = ()=>{
    const pathname = usePathname();

    return (
        <div className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4">
            {links.map((link)=>{
                // '/admin' would otherwise match every page underneath it
                const isActive = link.href === '/admin'
                    ? pathname === '/admin'
                    : pathname.startsWith(link.href);

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`rounded-md px-4 py-2 text-sm font-medium ${
                            isActive
                                ? 'bg-blue-700 text-white'
                                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </div>
    );
};

export default AdminNav;
