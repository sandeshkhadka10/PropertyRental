import connectDB from "@/config/database";
import Property from "@/models/Property";

// GET /api/properties/search
export const GET = async(request)=>{
    try{
        await connectDB();

        const {searchParams} = new URL(request.url);
        const location = searchParams.get('location');
        const propertyType = searchParams.get('propertyType');

        const locationTerms = (location || '')
            .split(/[,\s]+/)
            .map((term) => term.trim())
            .filter(Boolean);

        let query = {};

        if(locationTerms.length > 0){
            // Each search term must appear in at least one searchable field.
            query.$and = locationTerms.map((term) => {
                const locationPattern = new RegExp(term, 'i');

                return {
                    $or:[
                        {name:locationPattern},
                        {description:locationPattern},
                        {'location.city':locationPattern},
                        {'location.state':locationPattern},
                        {'location.street':locationPattern},
                        {'location.zipcode':locationPattern}
                    ]
                };
            });
        }

        // only check for property if its not 'All'
        if(propertyType && propertyType !== 'All'){
            const typePattern = new RegExp(propertyType,'i');
            query.type = typePattern;
        }

        const properties = await Property.find(query);

        return new Response(JSON.stringify(properties),{status:200})
    }catch(error){
        console.log(error);
        return new Response('Something went wrong',{status:500});
    }
}
