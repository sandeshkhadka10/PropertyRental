const PropertyCard = () => {
    return (
        <>
           {/* < !--Listing 1 -- > */}
            <div class="rounded-xl shadow-md relative">
                <img
                    src="images/properties/a1.jpg"
                    alt=""
                    class='w-full h-auto rounded-t-xl'
                />
                <div class="p-4">
                    <div class="text-left md:text-center lg:text-left mb-6">
                        <div class="text-gray-600">Apartment</div>
                        <h3 class="text-xl font-bold">Boston Commons Retreat</h3>
                    </div>
                    <h3
                        class="absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right"
                    >
                        $4,200/mo
                    </h3>

                    <div class="flex justify-center gap-4 text-gray-500 mb-4">
                        <p>
                            <i class="fa-solid fa-bed"></i> 3
                            <span class="md:hidden lg:inline">Beds</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-bath"></i> 2
                            <span class="md:hidden lg:inline">Baths</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-ruler-combined"></i>
                            1,500 <span class="md:hidden lg:inline">sqft</span>
                        </p>
                    </div>

                    <div
                        class="flex justify-center gap-4 text-green-900 text-sm mb-4"
                    >
                        <p><i class="fa-solid fa-money-bill"></i> Weekly</p>
                        <p><i class="fa-solid fa-money-bill"></i> Monthly</p>
                    </div>

                    <div class="border border-gray-100 mb-5"></div>

                    <div class="flex flex-col lg:flex-row justify-between mb-4">
                        <div class="flex align-middle gap-2 mb-4 lg:mb-0">
                            <i
                                class="fa-solid fa-location-dot text-lg text-orange-700"
                            ></i>
                            <span class="text-orange-700"> Boston MA </span>
                        </div>
                        <a
                            href="property.html"
                            class="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                        >
                            Details
                        </a>
                    </div>
                </div>
            </div>
            {/* <!--Listing 2 -- > */}
            <div class="rounded-xl shadow-md relative">
                <img
                    src="images/properties/b1.jpg"
                    alt=""
                    class="object-cover rounded-t-xl"
                />
                <div class="p-4">
                    <div class="text-left md:text-center lg:text-left mb-6">
                        <div class="text-gray-600">Loft</div>
                        <h3 class="text-xl font-bold">Cozy Downtown Loft</h3>
                    </div>
                    <h3
                        class="absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right"
                    >
                        $4,000/mo
                    </h3>

                    <div class="flex justify-center gap-4 text-gray-500 mb-4">
                        <p>
                            <i class="fa-solid fa-bed"></i> 2
                            <span class="md:hidden lg:inline">Beds</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-bath"></i> 2
                            <span class="md:hidden lg:inline">Baths</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-ruler-combined"></i>
                            1,800 <span class="md:hidden lg:inline">sqft</span>
                        </p>
                    </div>

                    <div
                        class="flex justify-center gap-4 text-green-900 text-sm mb-4"
                    >
                        <p><i class="fa-solid fa-money-bill"></i> Weekly</p>
                        <p><i class="fa-solid fa-money-bill"></i> Monthly</p>
                    </div>

                    <div class="border border-gray-100 mb-5"></div>

                    <div class="flex flex-col lg:flex-row justify-between mb-4">
                        <div class="flex align-middle gap-2 mb-4 lg:mb-0">
                            <i
                                class="fa-solid fa-location-dot text-lg text-orange-700"
                            ></i>
                            <span class="text-orange-700"> New York NY </span>
                        </div>
                        <a
                            href="property.html"
                            class="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                        >
                            Details
                        </a>
                    </div>
                </div>
            </div>
            {/* <!--Listing 3 -- > */}
            <div class="rounded-xl shadow-md relative">
                <img
                    src="images/properties/c1.jpg"
                    alt=""
                    class="object-cover rounded-t-xl"
                />
                <div class="p-4">
                    <div class="text-left md:text-center lg:text-left mb-6">
                        <div class="text-gray-600">Condo</div>
                        <h3 class="text-xl font-bold">Luxury Condo</h3>
                    </div>
                    <h3
                        class="absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right"
                    >
                        $3,300/mo
                    </h3>

                    <div class="flex justify-center gap-4 text-gray-500 mb-4">
                        <p>
                            <i class="fa-solid fa-bed"></i> 3
                            <span class="md:hidden lg:inline">Beds</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-bath"></i> 2
                            <span class="md:hidden lg:inline">Baths</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-ruler-combined"></i>
                            2,200 <span class="md:hidden lg:inline">sqft</span>
                        </p>
                    </div>

                    <div
                        class="flex justify-center gap-4 text-green-900 text-sm mb-4"
                    >
                        <p><i class="fa-solid fa-money-bill"></i> Nightly</p>
                        <p><i class="fa-solid fa-money-bill"></i> Weekly</p>
                        <p><i class="fa-solid fa-money-bill"></i> Monthly</p>
                    </div>

                    <div class="border border-gray-100 mb-5"></div>

                    <div class="flex flex-col lg:flex-row justify-between mb-4">
                        <div class="flex align-middle gap-2 mb-4 lg:mb-0">
                            <i
                                class="fa-solid fa-location-dot text-lg text-orange-700"
                            ></i>
                            <span class="text-orange-700"> Los Angeles CA </span>
                        </div>
                        <a
                            href="property.html"
                            class="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                        >
                            Details
                        </a>
                    </div>
                </div>
            </div>
            {/* <!--Listing 4 -- > */}
            <div class="rounded-xl shadow-md relative">
                <img
                    src="images/properties/d1.jpg"
                    alt=""
                    class="object-cover rounded-t-xl"
                />
                <div class="p-4">
                    <div class="text-left md:text-center lg:text-left mb-6">
                        <div class="text-gray-600">Cottage or Cabin</div>
                        <h3 class="text-xl font-bold">Charming Cottage Getaway</h3>
                    </div>
                    <h3
                        class="absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right"
                    >
                        $2,000/wk
                    </h3>

                    <div class="flex justify-center gap-4 text-gray-500 mb-4">
                        <p>
                            <i class="fa-solid fa-bed"></i> 2
                            <span class="md:hidden lg:inline">Beds</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-bath"></i> 1
                            <span class="md:hidden lg:inline">Baths</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-ruler-combined"></i>
                            900 <span class="md:hidden lg:inline">sqft</span>
                        </p>
                    </div>

                    <div
                        class="flex justify-center gap-4 text-green-900 text-sm mb-4"
                    >
                        <p><i class="fa-solid fa-money-bill"></i> Weekly</p>
                    </div>

                    <div class="border border-gray-100 mb-5"></div>

                    <div class="flex flex-col lg:flex-row justify-between">
                        <div class="flex align-middle gap-2 mb-4 lg:mb-0">
                            <i
                                class="fa-solid fa-location-dot text-lg text-orange-700"
                            ></i>
                            <span class="text-orange-700"> Austin TX </span>
                        </div>
                        <a
                            href="property.html"
                            class="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                        >
                            Details
                        </a>
                    </div>
                </div>
            </div>
            {/* <!--Listing 5 -- > */}
            <div class="rounded-xl shadow-md relative">
                <img
                    src="images/properties/e1.jpg"
                    alt=""
                    class="object-cover rounded-t-xl"
                />
                <div class="p-4">
                    <div class="text-left md:text-center lg:text-left mb-6">
                        <div class="text-gray-600">Studio</div>
                        <h3 class="text-xl font-bold">Modern Downtown Studio</h3>
                    </div>
                    <h3
                        class="absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right"
                    >
                        $4,200/mo
                    </h3>

                    <div class="flex justify-center gap-4 text-gray-500 mb-4">
                        <p>
                            <i class="fa-solid fa-bed"></i> 1
                            <span class="md:hidden lg:inline">Beds</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-bath"></i> 1
                            <span class="md:hidden lg:inline">Baths</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-ruler-combined"></i>
                            900 <span class="md:hidden lg:inline">sqft</span>
                        </p>
                    </div>

                    <div
                        class="flex justify-center gap-4 text-green-900 text-sm mb-4"
                    >
                        <p><i class="fa-solid fa-money-bill"></i> Weekly</p>
                        <p><i class="fa-solid fa-money-bill"></i> Monthly</p>
                    </div>

                    <div class="border border-gray-100 mb-5"></div>

                    <div class="flex flex-col lg:flex-row justify-between mb-4">
                        <div class="flex align-middle gap-2 mb-4 lg:mb-0">
                            <i
                                class="fa-solid fa-location-dot text-lg text-orange-700"
                            ></i>
                            <span class="text-orange-700"> Chicago IL </span>
                        </div>
                        <a
                            href="property.html"
                            class="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                        >
                            Details
                        </a>
                    </div>
                </div>
            </div>
            {/* <!--Listing 6 -- > */}
            <div class="rounded-xl shadow-md relative">
                <img
                    src="images/properties/f1.jpg"
                    alt=""
                    class="object-cover rounded-t-xl"
                />
                <div class="p-4">
                    <div class="text-left md:text-center lg:text-left mb-6">
                        <div class="text-gray-600">House</div>
                        <h3 class="text-xl font-bold">Seaside Retreat</h3>
                    </div>
                    <h3
                        class="absolute top-[10px] right-[10px] bg-white px-4 py-2 rounded-lg text-blue-500 font-bold text-right md:text-center lg:text-right"
                    >
                        $2,500/wk
                    </h3>

                    <div class="flex justify-center gap-4 text-gray-500 mb-4">
                        <p>
                            <i class="fa-solid fa-bed"></i> 4
                            <span class="md:hidden lg:inline">Beds</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-bath"></i> 3
                            <span class="md:hidden lg:inline">Baths</span>
                        </p>
                        <p>
                            <i class="fa-solid fa-ruler-combined"></i>
                            2,800 <span class="md:hidden lg:inline">sqft</span>
                        </p>
                    </div>

                    <div
                        class="flex justify-center gap-4 text-green-900 text-sm mb-4"
                    >
                        <p><i class="fa-solid fa-money-bill"></i> Weekly</p>
                        <p><i class="fa-solid fa-money-bill"></i> Monthly</p>
                    </div>

                    <div class="border border-gray-100 mb-5"></div>

                    <div class="flex flex-col lg:flex-row justify-between mb-4">
                        <div class="flex align-middle gap-2 mb-4 lg:mb-0">
                            <i
                                class="fa-solid fa-location-dot text-lg text-orange-700"
                            ></i>
                            <span class="text-orange-700"> Miami FL </span>
                        </div>
                        <a
                            href="property.html"
                            class="h-[36px] bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-center text-sm"
                        >
                            Details
                        </a>
                    </div>
                </div>
            </div>
        </>

    )
}

export default PropertyCard;