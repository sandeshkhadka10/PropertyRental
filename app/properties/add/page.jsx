import Link from "next/link";
import { redirect } from "next/navigation";
import PropertyAddForm from "@/components/PropertyAddForm";
import AccountRoleSwitch from "@/components/AccountRoleSwitch";
import connectDB from "@/config/database";
import User from "@/models/User";
import { getSessionUser } from "@/utils/getSessionUser";

// middleware.js already sends anonymous visitors to /login, the redirect below
// is only a second line of defence. What is left after that is the role. POST
// /api/properties enforces the same rule, this only saves a tenant from filling
// in the whole form to be told no at the end.
const PropertyAdd = async () => {
    await connectDB();

    const sessionUser = await getSessionUser();

    if (!sessionUser?.userId) {
        redirect('/login?callbackUrl=/properties/add');
    }

    const user = await User.findById(sessionUser.userId).select('role');

    const canList = user?.role === 'landlord' || user?.role === 'admin';

    return (
        <section className="bg-blue-50">
            <div className="container m-auto max-w-2xl py-24">
                <div
                    className="bg-white px-6 py-8 mb-4 shadow-md rounded-md border m-4 md:m-0"
                >
                    {canList ? (
                        <PropertyAddForm/>
                    ) : (
                        <div>
                            <h2 className="text-3xl text-center font-semibold mb-4">
                                Add Property
                            </h2>
                            <p className="text-gray-700 mb-2">
                                Listing a property needs a landlord account. Yours is set to
                                tenant at the moment.
                            </p>
                            <p className="text-gray-600 text-sm mb-4">
                                Switch below and the form appears straight away. Every new
                                listing is then reviewed by an admin before it goes live.
                            </p>
                            <AccountRoleSwitch/>
                            <p className="mt-6 text-sm">
                                <Link href="/properties" className="text-blue-500 hover:text-blue-600">
                                    Browse properties instead
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    )
}

export default PropertyAdd;
