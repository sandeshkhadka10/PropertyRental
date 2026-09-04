import {z} from 'zod';
import {PAYMENT_GATEWAYS} from '@/models/Booking';

export const paymentInitiateSchema = z.object({
    bookingId: z.string().min(1, "Booking is required"),
    gateway: z.enum(PAYMENT_GATEWAYS, {message:"Choose a payment method"})
});
