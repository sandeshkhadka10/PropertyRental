import {z} from 'zod';
import {calculateStayDays, parseBookingDate, todayUTC} from '@/utils/bookingPricing';

// a stay longer than this is not a booking
export const MAX_STAY_DAYS = 365;
export const MAX_GUESTS = 30;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const dateOnly = (label) =>
    z.string()
        .min(1, `${label} is required`)
        .regex(DATE_ONLY, `${label} must be a valid date`)
        .refine((value) => parseBookingDate(value) !== null, `${label} must be a valid date`);

export const bookingSchema = z.object({
    property: z.string().min(1, "Property is required"),
    checkIn: dateOnly('Check-in date'),
    checkOut: dateOnly('Check-out date'),
    guests: z.coerce
        .number()
        .int("Guests must be a whole number")
        .min(1, "At least 1 guest is required")
        .max(MAX_GUESTS, `Maximum ${MAX_GUESTS} guests`),
    note: z.string().max(500, "Note cannot be longer than 500 characters").optional()
}).refine((data) => parseBookingDate(data.checkIn) >= todayUTC(), {
    message:"Check-in cannot be in the past",
    path:["checkIn"]
}).refine((data) => calculateStayDays(data.checkIn, data.checkOut) >= 1, {
    message:"Check-out must be after check-in",
    path:["checkOut"]
}).refine((data) => calculateStayDays(data.checkIn, data.checkOut) <= MAX_STAY_DAYS, {
    message:`A stay cannot be longer than ${MAX_STAY_DAYS} days`,
    path:["checkOut"]
});

// Only these two sides may move a booking on, and only along these edges.
// Anything not listed here is rejected, so a cancelled booking can never be
// quietly revived and a guest can never confirm their own request.
export const ALLOWED_STATUS_TRANSITIONS = {
    owner:{
        pending:['confirmed','cancelled'],
        confirmed:['cancelled','completed']
    },
    guest:{
        pending:['cancelled'],
        confirmed:['cancelled']
    }
};

export const statusUpdateSchema = z.object({
    status: z.enum(['confirmed','cancelled','completed'], {
        message:"Unknown booking status"
    })
});
