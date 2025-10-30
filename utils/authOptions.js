import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      
      // this is added to test that the different user can access it
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callback:{
    // Invoked on success signin
    async signIn({profile}){
        // 1. Connect to database
        // 2. Check if user exits
        // 3. If not, add user to database
        // 4. Return true to allow sign in
    },
    // Modifies the session object
    async session({session}){
        // 1. Get user from database
        // 2. Assign the user id to the session
        // 3. Return session
    }
  }
};
