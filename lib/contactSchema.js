import {z} from 'zod';

export const contactSchema = z.object({
    name:z.string().min(1, "Property name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),
    phone:z.string().min(10, "Phone number should contain 10 numbers"),
    message:z.string().min(1, "Message is required")
});

// A reply is written from the messages page by someone who is already signed
// in, so the name and email the contact form asks for are taken from the
// session instead of the form.
export const replySchema = z.object({
    message:z.string().min(1, "Reply message is required")
});