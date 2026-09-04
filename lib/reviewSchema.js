import {z} from 'zod';

export const reviewSchema = z.object({
    rating: z.coerce.number().int().min(1, "Please pick a rating").max(5, "Rating cannot be more than 5"),
    title: z.string().max(100, "Title cannot be longer than 100 characters").optional(),
    body: z.string().min(1, "Please write a few words about your stay").max(2000, "Review is too long")
});
