// It is a server-side function that allows you to retrieve
// the current-logged-in user session from the server
// without needing to call an API route or use client-side hooks.
import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions.js";

export const getSessionUser = async () => {
  try {
    // tyo current logged-in user ko session ho kinai bhanera herna
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return new Response("Unauthorized", { status: 401 });
    }
    return {
      user: session.user,
      userId: session.user.id,
      // the session callback reads this straight from the database on every
      // call, so it is current rather than whatever was true at sign in
      role: session.user.role || 'tenant',
    };
  } catch (error) {
    console.error(error);
    return null;
  }
};
