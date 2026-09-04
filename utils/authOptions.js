import GoogleProvider from "next-auth/providers/google";
import connectDB from "@/config/database";
import User from "@/models/User";

// Comma separated list of emails that are always promoted to admin on sign in,
// e.g. ADMIN_EMAILS="me@example.com,partner@example.com". This is how the very
// first admin gets created, since there is no admin around yet to promote one.
const bootstrapAdminEmails = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

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
  // Our own sign in screen, so signIn() and every redirect out of a protected
  // page land on /login instead of the default next-auth page.
  pages: {
    signIn: '/login',
    error: '/login'
  },
  callbacks:{
    // Invoked on success signin
    async signIn({profile}){
        // 1. Connect to database
        await connectDB();

        // 2. Check if user exits
        const userExits = await User.findOne({email:profile.email});

        // is this one of the bootstrap admins from the environment?
        const isBootstrapAdmin = bootstrapAdminEmails.includes(
          (profile.email || '').toLowerCase()
        );

        // 3. If not, add user to database
        if(!userExits){
          // Truncate user name if too long
          const username = profile.name.slice(0,20);

          await User.create({
            email:profile.email,
            username,
            image:profile.picture,
            // everyone starts as a tenant and upgrades themselves to landlord
            // from their profile, unless they are a bootstrap admin
            role: isBootstrapAdmin ? 'admin' : 'tenant'
          });
        }else if(isBootstrapAdmin && userExits.role !== 'admin'){
          // an existing account listed in ADMIN_EMAILS gets promoted
          userExits.role = 'admin';
          await userExits.save();
        }

        // 4. Return true to allow sign in
        return true;
    },
    // Puts the role on the JWT so middleware.js can gate /admin at the edge,
    // where there is no database access. The role is looked up on every refresh
    // so a promotion or demotion is picked up without signing out.
    async jwt({token}){
        if(!token?.email){
          return token;
        }

        try{
          await connectDB();
          const user = await User.findOne({email:token.email}).select('role');
          token.role = user?.role || 'tenant';
        }catch(error){
          console.log(error);
        }

        return token;
    },
    // Modifies the session object
    async session({session}){
        await connectDB();

        // 1. Get user from database
        const user = await User.findOne({email:session.user.email});

        // 2. Assign the user id to the session
        session.user.id = user._id.toString();

        // 3. Assign the role so the UI can show landlord/admin only controls
        session.user.role = user.role || 'tenant';

        // 4. Return session
        return session;
    }
  }
};

// When you use NextAuth.js, it automatically creates a session
// object that represents the currently logged-in user.
