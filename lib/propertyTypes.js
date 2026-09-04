// The one list of rental types, shared by the add form, the edit form and the
// search bar so the three can't drift apart again.
//
// The set is deliberately Nepal-specific. The old list was imported from a US
// template and carried Condo, Chalet and Loft, none of which mean anything to a
// landlord in Kathmandu, while the things people here actually let out - a
// private room, a hostel bed, a homestay - had nowhere to go.
//
// `value` is what gets stored on Property.type and put in the ?propertyType=
// query string, so changing one means migrating existing documents - see
// LEGACY_PROPERTY_TYPES and scripts/migrate-property-types.js. Values avoid the
// slash the labels use, to keep the query string readable.
export const PROPERTY_TYPES = [
    {value:'House',label:'House'},
    {value:'Flat Or Apartment',label:'Flat / Apartment'},
    {value:'Studio',label:'Studio'},
    {value:'Private Room',label:'Private Room'},
    {value:'Hostel Or Dorm',label:'Hostel / Dorm'},
    {value:'Cottage Or Cabin',label:'Cottage / Cabin'},
    {value:'Guesthouse',label:'Guesthouse'},
    {value:'Homestay',label:'Homestay'},
    {value:'Villa Or Bungalow',label:'Villa / Bungalow'}
];

// Retired types and what each one becomes. The migration script reads this, and
// the edit form falls through it so an un-migrated listing still opens with its
// type selected instead of a blank dropdown.
//
// 'Other' is deliberately absent: it used to be a real choice, so a document
// holding it could be anything at all, and guessing a replacement would be
// worse than making the owner pick one.
export const LEGACY_PROPERTY_TYPES = {
    'Apartment':'Flat Or Apartment',
    'Flat':'Flat Or Apartment',
    'Condo':'Flat Or Apartment',
    'Loft':'Flat Or Apartment',
    'Room':'Private Room',
    'Hostel Or PG':'Hostel Or Dorm',
    'Chalet':'Cottage Or Cabin',
    'Cabin Or Cottage':'Cottage Or Cabin'
};

// Maps whatever is stored on a document onto a value the <select> can show.
// There is no catch-all option to fall back on, so anything unrecognised
// returns '' and the form asks the owner to choose - better than silently
// filing an unknown listing under the wrong type.
export const resolvePropertyType = (type)=>{
    if(!type) return '';
    if(PROPERTY_TYPES.some((option)=>option.value === type)) return type;
    return LEGACY_PROPERTY_TYPES[type] || '';
};
