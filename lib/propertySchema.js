import {z} from 'zod';

export const propertySchema = z.object({
    type:z.string().min(1,'Property type is required'),
    name:z.string().min(1,'Property name is required'),
    description:z.string().optional(),
    location:z.object({
        street:z.string().optional(),
        city:z.string().min(1,'City is required'),
        state:z.string().min(1,'State is required'),
        zipcode:z.string().optional()
    }),
    beds:z.number({invalid_type_error:'Beds must be a number'}).min(1),
    baths:z.number({invalid_type_error:'Baths must be a number'}).min(1),
    square_feet:z.number({invalid_type_error:'Square feet must be a number'}).min(1000),
    amenities:z.array(a.string()).optional(),
    rates:z.object({
        weekly:z.number().optional().nullable(),
        monthly:z.number().optional().nullable(),
        nightly:z.number().optional().nullable()
    }),
    seller_info:z.object({
        name:z.string().optional(),
        email:z.string().email('Invalid email address'),
        phone:z.string().optional()
    }),
    images:z.array(z.any()).min(1,'At least one image is required').max(4,'Maximum 4 images allowed')
});