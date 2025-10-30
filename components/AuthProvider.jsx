// SessionProvider provides session state like 
// whether a user is logged in,
// who they are, and their access token.
import {SessionProvider} from 'next-auth/react';

const AuthProvider = ({children})=>{
    return(
        // here it makes session info available to child components
        <SessionProvider>{children}</SessionProvider>
    )
}

export default AuthProvider;

// SessionProvider doesn't block access to pages
// or data it only makes session info available
// throughout the app