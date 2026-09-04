'use client';
import {createContext,useContext,useState} from 'react';

// create context
const GlobalContext = createContext();

// Create a provider
export function GlobalProvider({children}){
    const [unreadMessageCount,setUnreadMessageCount] = useState(0);

    // drives the badge on the navbar bell. Kept here rather than in the bell
    // itself so the notifications page can decrement it as rows are read.
    const [unreadNotificationCount,setUnreadNotificationCount] = useState(0);

    return(
        <GlobalContext.Provider value={{
            unreadMessageCount,
            setUnreadMessageCount,
            unreadNotificationCount,
            setUnreadNotificationCount
        }}>
            {children}
        </GlobalContext.Provider>
    )
}

// create a custom hook to access context
export function useGlobalContext(){
    return useContext(GlobalContext);
}
