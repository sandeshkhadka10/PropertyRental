import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/config/database";
import User from "@/models/User";

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
        await connectDB();

        // 2. Check if user exits
        const userExits = await User.findOne({email:profile.email});

        // 3. If not, add user to database
        if(!userExits){
          // Truncate user name if too long
          const username = profile.name.slice(0,20);

          await User.create({
            email:profile.email,
            username,
            image:profile.picture
          });
        }

        // 4. Return true to allow sign in
        return true;
    },
    // Modifies the session object
    async session({session}){
        // 1. Get user from database
        const user = await User.findOne({email:session.user.email});

        // 2. Assign the user id to the session
        session.user.id = user._id.toString();

        // 3. Return session
        return session;
    }
  }
};

// When you use NextAuth.js, it automatically creates a session
// object that represents the currently logged-in user.
