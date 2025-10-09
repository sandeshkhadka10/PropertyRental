import Link from "next/link";

const PropertiesPage = () => {
    return (
        <div>
            <h1 className="text-3xl">These are the properties</h1>
            <Link href='/' className="no-underline text-blue-600 hover:underline">
                Back to home
            </Link>


        </div>
    )
}

export default PropertiesPage;