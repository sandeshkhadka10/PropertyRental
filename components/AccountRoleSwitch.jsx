'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-toastify';
import {FaUser, FaUserTie, FaUserShield, FaExchangeAlt} from 'react-icons/fa';

const ROLE_LABELS = {
    tenant:'Tenant',
    landlord:'Landlord',
    admin:'Admin'
};

const ROLE_ICONS = {
    tenant:FaUser,
    landlord:FaUserTie,
    admin:FaUserShield
};

// The read-only half of the panel, identical whichever role you hold.
const RoleSummary = ({role})=>{
    const Icon = ROLE_ICONS[role] || FaUser;

    return (
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-100 text-blue-600">
                <Icon className="h-4 w-4" />
            </span>
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Account type
                </p>
                <p className="text-base font-bold text-gray-900">{ROLE_LABELS[role]}</p>
            </div>
        </div>
    );
};

// Lets someone turn their own account into a landlord so they can list a
// property, and back again. Only an admin can hand out the admin role.
const AccountRoleSwitch = ()=>{
    const {data:session, update} = useSession();
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const role = session?.user?.role || 'tenant';

    if(role === 'admin'){
        return (
            <div className="mt-4">
                <RoleSummary role="admin" />
                <p className="mt-3 text-sm text-gray-600">
                    You can list properties and moderate everyone else&apos;s.
                </p>
            </div>
        );
    }

    const nextRole = role === 'landlord' ? 'tenant' : 'landlord';

    const handleSwitch = async ()=>{
        setSaving(true);
        try{
            const res = await fetch('/api/users/me',{
                method:'PATCH',
                headers:{'Content-Type':'application/json'},
                body:JSON.stringify({role:nextRole})
            });

            if(res.ok){
                // pulls the new role back into the session, which is what the
                // navbar reads, then re-runs the server components that decide
                // what a landlord is allowed to see
                await update();
                router.refresh();
                toast.success(`You are now a ${ROLE_LABELS[nextRole].toLowerCase()}`);
            }else{
                toast.error(await res.text() || 'Could not change your account type');
            }
        }catch(error){
            console.log(error);
            toast.error('Could not change your account type');
        }finally{
            setSaving(false);
        }
    };

    return (
        <div className="mt-4">
            <RoleSummary role={role} />
            <p className="mt-3 text-sm text-gray-600">
                {role === 'landlord'
                    ? 'You can list properties. Listings already published stay up if you switch back.'
                    : 'Switch to a landlord account to list your own properties.'}
            </p>
            <button
                type="button"
                disabled={saving}
                onClick={handleSwitch}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
            >
                <FaExchangeAlt className="h-3.5 w-3.5" />
                {saving ? 'Saving...' : `Switch to ${ROLE_LABELS[nextRole].toLowerCase()}`}
            </button>
        </div>
    );
};

export default AccountRoleSwitch;
