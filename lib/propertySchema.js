import { z } from "zod";

const emptyToUndefined = (value) => (value === '' ? undefined : value);

export const propertySchema = z.object({
  type: z.string().min(1, "Property type is required"),
  name: z.string().min(1, "Property name is required"),
  description: z.string().min(10, "Description is required"),
  location: z.object({
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "Province is required"),
    lat: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
    lng: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  }),
  // coerce automatically converts the input into a number before validating and doesn't accept NaN
  beds: z.coerce
    .number()
    .min(1, "At least 1 bed is required"),
  baths: z.coerce
    .number()
    .min(1, "At least 1 bath is required"),
  square_feet: z.coerce
    .number()
    .min(70, "Square feet must be at least 70"),
  amenities: z
    .array(z.string())
    .min(1, "At least one amenity must be selected"),
  // A stay is charged per day, so the day rate is the only one a listing has
  // and it is required - without it the property cannot be booked at all.
  rates: z.object({
    daily: z.coerce.number().min(500, "Day rate must be 500 or greater"),
  }),
  seller_info: z.object({
    name: z.string().min(1, "Seller name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    phone: z.string().min(10, "Phone number should contain 10 numbers"),
  }),
  images: z
    .array(z.any())
    .min(1, "At least one image is required")
    .max(4, "Maximum 4 images allowed"),
});