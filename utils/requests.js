const apiDomain = process.env.NEXT_API_DOMAIN || null;

async function fetchProperties(){
    try{
        // handle the case where domain is not available yet
        if(!apiDomain){
            return [];
        }
        const res = await fetch(`${apiDomain}/properties`);
        if(!res.ok){
            throw new error('Failed to fetch data');
        }
        return res.json();
    }catch(error){
        console.log(error);
        return [];
    }
}

export {fetchProperties};