import { z } from "zod";

export const propertySchema = z.object({
  type: z.string().min(1, "Property type is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),

  location: z.object({
    street: z.string().optional(),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipcode: z.string().optional(),
  }),

  beds: z.coerce.number().min(0, "Beds must be 0 or more"),
  baths: z.coerce.number().min(0, "Baths must be 0 or more"),
  square_feet: z.coerce.number().min(0, "Square feet must be 0 or more"),

  amenities: z.array(z.string()).optional(),

  rates: z.object({
    weekly: z.coerce.number().optional(),
    monthly: z.coerce.number().optional(),
    nightly: z.coerce.number().optional(),
  }),

  seller_info: z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email").min(1, "Email is required"),
    phone: z.string().optional(),
  })
});
