import { z } from "zod";

export const propertySchema = z.object({
  type: z.string().min(1, "Property type is required"),
  name: z.string().min(1, "Property name is required"),
  description: z.string().min(10, "Description is required"),
  location: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipcode: z.string().min(1, "Zipcode is required"),
  }),
  beds: z.coerce
    .number({
      required_error: "Number of beds is required",
      invalid_type_error: "Number of beds is required",
    })
    .min(1, "At least 1 bed is required"),
  baths: z.coerce
    .number({
      required_error: "Number of baths is required",
      invalid_type_error: "Number of baths is required",
    })
    .min(1, "At least 1 bath is required"),
  square_feet: z.coerce
    .number({
      required_error: "Square feet is required",
      invalid_type_error: "Square feet is required",
    })
    .min(1, "Square feet must be at least 1"),
  amenities: z
    .array(z.string())
    .min(1, "At least one amenity must be selected"),
  rates: z.object({
    weekly: z.coerce
      .number({
        required_error: "Weekly rate is required",
        invalid_type_error: "Weekly rate is required",
      })
      .min(1, "Weekly rate must be 0 or greater"),
    monthly: z.coerce
      .number({
        required_error: "Monthly rate is required",
        invalid_type_error: "Monthly rate is required",
      })
      .min(1, "Monthly rate must be 0 or greater"),
    nightly: z.coerce
      .number({
        required_error: "Nightly rate is required",
        invalid_type_error: "Nightly rate is required",
      })
      .min(1, "Nightly rate must be 0 or greater"),
  }),
  seller_info: z.object({
    name: z.string().min(1, "Seller name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    phone: z.string().min(1, "Phone number is required"),
  }),
  images: z
    .array(z.any())
    .min(1, "At least one image is required")
    .max(4, "Maximum 4 images allowed"),
});
