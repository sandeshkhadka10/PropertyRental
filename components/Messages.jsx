'use client';
import {useState,useEffect} from 'react';
import Spinner from './Spinner';

const Messages = ()=>{
    const [messages,setMessages] = useState([]);
    const [loading,setLoading] = useState(true);

    useEffect(()=>{
        const getMessages = async()=>{
            try{
                const res = await fetch('/api/messages');
                if(res.status === 200){
                    const data = res.json();
                    setMessages(data);
                }
            }catch(error){
                console.log('Error fetching messages: ', error);
            }
        }
        getMessages();
    },[]);

    return(
        <div>
            Message
        </div>
    )
}

export default Messages;