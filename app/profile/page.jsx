'use client';
import { useState, useEffect, useMemo } from 'react';
import Image from "next/image";
import Link from "next/link";
import { useSession } from 'next-auth/react';
import {
    FaPlus,
    FaHome,
    FaCheckCircle,
    FaRegClock,
    FaStar,
    FaBookmark,
    FaEnvelope,
    FaBell,
    FaCalendarAlt,
    FaUserShield,
    FaChevronRight,
    FaExclamationTriangle,
    FaTrash
} from 'react-icons/fa';
import profileDefault from '@/assets/images/profile.png';
import AccountRoleSwitch from '@/components/AccountRoleSwitch';
import ProfileListingCard from '@/components/ProfileListingCard';
import { toast } from 'react-toastify';

const ROLE_LABELS = {
    tenant: 'Tenant',
    landlord: 'Landlord',
    admin: 'Admin'
};

// A listing saved before moderation existed has no status and counts as live,
// exactly the way the public queries treat it.
const isLive = (property) => !property.status || property.status === 'approved';
const needsAttention = (property) =>
    property.status === 'rejected' || property.status === 'flagged';

const FILTERS = [
    { key: 'all', label: 'All', match: () => true },
    { key: 'live', label: 'Live', match: isLive },
    { key: 'pending', label: 'Pending review', match: (p) => p.status === 'pending' },
    { key: 'attention', label: 'Needs attention', match: needsAttention }
];

const ProfilePage = () => {
    const { data: session, status: sessionStatus } = useSession();
    const profileImage = session?.user?.image;
    const profileName = session?.user?.name;
    const profileEmail = session?.user?.email;
    const role = session?.user?.role || 'tenant';

    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    // the listing waiting on a yes/no in the confirm dialog
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        const fetchUserProperties = async (userId) => {
            if (!userId) {
                return;
            }
            try {
                const res = await fetch(`/api/properties/user/${userId}`);
                if (res.status == 200) {
                    const data = await res.json();
                    setProperties(data);
                }
            } catch (error) {
                console.log(error);
            } finally {
                setLoading(false);
            }
        }
        // fetch user properties when session is available
        if (session?.user?.id) {
            fetchUserProperties(session.user.id);
        } else if (sessionStatus === 'unauthenticated') {
            // otherwise the skeletons would sit there for ever
            setLoading(false);
        }
    }, [session, sessionStatus]);

    // close the confirm dialog on Escape, the way a dialog is expected to behave
    useEffect(() => {
        if (!pendingDelete) {
            return;
        }
        const onKeyDown = (event) => {
            if (event.key === 'Escape' && !deleting) {
                setPendingDelete(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [pendingDelete, deleting]);

    const stats = useMemo(() => {
        const rated = properties.filter((property) => property.rating_count > 0);
        const reviews = rated.reduce((total, property) => total + property.rating_count, 0);
        // weighted by review count, so a listing with 20 reviews carries more
        // than one with a single five star
        const ratingSum = rated.reduce(
            (total, property) => total + (property.rating_avg || 0) * property.rating_count,
            0
        );

        return {
            total: properties.length,
            live: properties.filter(isLive).length,
            pending: properties.filter((property) => property.status === 'pending').length,
            attention: properties.filter(needsAttention).length,
            reviews,
            rating: reviews > 0 ? ratingSum / reviews : 0
        };
    }, [properties]);

    const shown = useMemo(() => {
        const active = FILTERS.find((option) => option.key === filter) || FILTERS[0];
        return properties.filter(active.match);
    }, [properties, filter]);

    const handleDeleteProperty = async () => {
        const property = pendingDelete;
        if (!property) {
            return;
        }
        setDeleting(true);
        try {
            const res = await fetch(`/api/properties/${property._id}`, { method: 'DELETE' });
            if (res.status === 200) {
                // remove the property from state
                setProperties((current) =>
                    current.filter((item) => item._id !== property._id)
                );
                toast.success('Property Deleted');
                setPendingDelete(null);
            } else {
                toast.error('Failed to delete');
            }
        } catch (error) {
            toast.error('Failed to delete');
            console.log(error);
        } finally {
            setDeleting(false);
        }
    };

    const statCards = [
        { label: 'Listings', value: stats.total, icon: FaHome, tone: 'bg-blue-50 text-blue-600' },
        { label: 'Live', value: stats.live, icon: FaCheckCircle, tone: 'bg-green-50 text-green-600' },
        { label: 'Pending review', value: stats.pending, icon: FaRegClock, tone: 'bg-amber-50 text-amber-600' },
        {
            label: stats.reviews === 1 ? '1 review' : `${stats.reviews} reviews`,
            value: stats.reviews > 0 ? stats.rating.toFixed(1) : '—',
            icon: FaStar,
            tone: 'bg-yellow-50 text-yellow-600'
        }
    ];

    const quickLinks = [
        { href: '/properties/saved', label: 'Saved properties', icon: FaBookmark },
        { href: '/messages', label: 'Messages', icon: FaEnvelope },
        { href: '/notifications', label: 'Notifications', icon: FaBell },
        ...(role === 'admin'
            ? [{ href: '/admin', label: 'Admin panel', icon: FaUserShield }]
            : [])
    ];

    return (
        <section className="bg-blue-50 min-h-screen">
            <div className="container m-auto max-w-7xl px-4 py-10 md:py-14">

                {/* ---- header -------------------------------------------- */}
                <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 py-8 shadow-lg sm:px-10">
                    {/* soft light behind the avatar, purely decorative */}
                    <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
                    <div className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-indigo-400/20 blur-3xl" />

                    <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                            <Image
                                className="h-24 w-24 rounded-full object-cover ring-4 ring-white/30 sm:h-28 sm:w-28"
                                src={profileImage || profileDefault}
                                width={200}
                                height={200}
                                alt={profileName ? `${profileName}'s profile picture` : 'Profile picture'}
                            />
                            <div className="min-w-0">
                                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/30">
                                    {ROLE_LABELS[role] || ROLE_LABELS.tenant}
                                </span>
                                <h1 className="mt-2 truncate text-2xl font-bold text-white sm:text-3xl">
                                    {profileName || 'Your Profile'}
                                </h1>
                                <p className="mt-1 truncate text-sm text-blue-100">{profileEmail}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3 md:justify-end">
                            <Link
                                href="/properties/add"
                                className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 dark:bg-blue-500 dark:text-white dark:hover:bg-blue-400"
                            >
                                <FaPlus className="h-3.5 w-3.5" />
                                Add Property
                            </Link>
                            <Link
                                href="/bookings"
                                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/20"
                            >
                                <FaCalendarAlt className="h-3.5 w-3.5" />
                                Bookings
                            </Link>
                        </div>
                    </div>
                </header>

                {/* ---- stats --------------------------------------------- */}
                <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                    {statCards.map(({ label, value, icon: Icon, tone }) => (
                        <div
                            key={label}
                            className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                        >
                            <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-lg ${tone}`}>
                                <Icon className="h-5 w-5" />
                            </span>
                            <div className="min-w-0">
                                <p className="text-2xl font-bold leading-none text-gray-900">
                                    {loading ? '—' : value}
                                </p>
                                <p className="mt-1 truncate text-sm text-gray-500">{label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">

                    {/* ---- sidebar --------------------------------------- */}
                    <aside className="space-y-6 lg:col-span-1">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="text-lg font-bold text-gray-900">Account</h2>
                            <AccountRoleSwitch />
                        </div>

                        <nav className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <h2 className="border-b border-gray-200 px-6 py-4 text-lg font-bold text-gray-900">
                                Shortcuts
                            </h2>
                            <ul>
                                {quickLinks.map(({ href, label, icon: Icon }) => (
                                    <li key={href} className="border-b border-gray-100 last:border-b-0">
                                        <Link
                                            href={href}
                                            className="flex items-center gap-3 px-6 py-3.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 hover:text-blue-600"
                                        >
                                            <Icon className="h-4 w-4 text-gray-400" />
                                            <span className="flex-1">{label}</span>
                                            <FaChevronRight className="h-3 w-3 text-gray-300" />
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </aside>

                    {/* ---- listings -------------------------------------- */}
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-lg font-bold text-gray-900">
                                    Your Listings
                                    {!loading && stats.total > 0 && (
                                        <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm font-semibold text-gray-600">
                                            {stats.total}
                                        </span>
                                    )}
                                </h2>
                                {stats.attention > 0 && (
                                    <span className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200">
                                        <FaExclamationTriangle className="h-3 w-3" />
                                        {stats.attention} need{stats.attention === 1 ? 's' : ''} your attention
                                    </span>
                                )}
                            </div>

                            {/* the chips only earn their room once there is
                                something to sift through */}
                            {!loading && stats.total > 1 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {FILTERS.map((option) => {
                                        const count = properties.filter(option.match).length;
                                        if (count === 0 && option.key !== 'all') {
                                            return null;
                                        }
                                        const active = filter === option.key;
                                        return (
                                            <button
                                                key={option.key}
                                                type="button"
                                                onClick={() => setFilter(option.key)}
                                                aria-pressed={active}
                                                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${active
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                            >
                                                {option.label} ({count})
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-5">
                                {loading ? (
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        {[0, 1, 2, 3].map((key) => (
                                            <div
                                                key={key}
                                                className="overflow-hidden rounded-xl border border-gray-200"
                                            >
                                                <div className="aspect-[16/10] animate-pulse bg-gray-100" />
                                                <div className="space-y-3 p-4">
                                                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-100" />
                                                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                                                    <div className="h-8 w-full animate-pulse rounded bg-gray-100" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : properties.length === 0 ? (
                                    <div className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-12 text-center">
                                        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blue-50 text-blue-500">
                                            <FaHome className="h-6 w-6" />
                                        </span>
                                        <h3 className="mt-4 text-lg font-semibold text-gray-900">
                                            You have no property listings
                                        </h3>
                                        <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
                                            List your first property and it will show up here once an
                                            admin has reviewed it.
                                        </p>
                                        <Link
                                            href="/properties/add"
                                            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                                        >
                                            <FaPlus className="h-3.5 w-3.5" />
                                            Add Property
                                        </Link>
                                    </div>
                                ) : shown.length === 0 ? (
                                    <p className="rounded-xl border-2 border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
                                        No listings in this group.
                                    </p>
                                ) : (
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        {shown.map((property) => (
                                            <ProfileListingCard
                                                key={property._id}
                                                property={property}
                                                onDelete={setPendingDelete}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ---- delete confirmation ------------------------------------
                replaces window.confirm, which cannot be styled and reads as a
                browser error next to the rest of the page */}
            {pendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => !deleting && setPendingDelete(null)}
                    />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-listing-title"
                        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
                    >
                        <span className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
                            <FaTrash className="h-5 w-5" />
                        </span>
                        <h2
                            id="delete-listing-title"
                            className="mt-4 text-xl font-bold text-gray-900"
                        >
                            Delete this listing?
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            <span className="font-semibold text-gray-800">{pendingDelete.name}</span>{' '}
                            will be removed for good. This cannot be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={() => setPendingDelete(null)}
                                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={deleting}
                                onClick={handleDeleteProperty}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                            >
                                {deleting ? 'Deleting...' : 'Delete listing'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}

export default ProfilePage;
