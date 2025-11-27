import connectDB from "@/config/database";
import Property from "@/models/Property";

// GET /api/properties/search
export const GET = async(request)=>{
    try{
        await connectDB();

        const {searchParams} = new URL(request.url);
        const location = searchParams.get('location');
        const propertyType = searchParams.get('propertyType');

        // console.log(location,propertyType);

        // Match location pattern against database field
        // here i make it case insensitive
        const locationPattern = new RegExp(location,'i');

        // returns all properties where any of the following fields match the location search
        let query = {
            // $or operator tells MongoDB to match if at least one condition is true
            $or:[
                {name:locationPattern},
                {description:locationPattern},
                {'location.street':locationPattern},
                {'location.city':locationPattern},
                {'location.state':locationPattern},
                {'location.zipcode':locationPattern}
            ],
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