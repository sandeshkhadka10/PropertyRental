import {z} from 'zod';

export const contactSchema = z.object({
    name:z.string().min(1, "Property name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    phone:z.string().min(10, "Phone number should contain 10 numbers"),
    body:z.string().min(1, "Description is required")
});