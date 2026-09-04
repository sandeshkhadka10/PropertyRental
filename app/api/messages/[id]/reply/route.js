import connectDB from "@/config/database";
import Message from "@/models/Message";
import {getSessionUser} from '@/utils/getSessionUser';
import {replySchema} from '@/lib/contactSchema';

export const dynamic = 'force-dynamic';

// POST /api/messages/:id/reply
// Answers a message from inside the site: the reply is stored as a message of
// its own, addressed back to whoever wrote the original, so the other side
// picks it up in their inbox and can answer it in turn.
export const POST = async(request,{params})=>{
    try{
        await connectDB();

        const {id} = await params;

        const sessionUser = await getSessionUser();
        if(!sessionUser || !sessionUser.user){
            return new Response(JSON.stringify({message:'You must be logged in'}),{status:401});
        }
        const {user,userId} = sessionUser;

        const original = await Message.findById(id);
        if(!original){
            return new Response(JSON.stringify({message:'Message not found'}),{status:404});
        }

        // only the person the message was addressed to can answer it
        if(original.recipient.toString() !== userId){
            return new Response(JSON.stringify({message:'Unauthorized'}),{status:401});
        }

        const body = await request.json();
        const parsed = replySchema.safeParse(body);
        if(!parsed.success){
            return new Response(
                JSON.stringify({message:parsed.error.issues[0].message}),
                {status:400}
            );
        }

        const reply = new Message({
            sender:userId,
            recipient:original.sender,
            property:original.property,
            name:user.name || user.email,
            email:user.email,
            body:parsed.data.message,
            replyTo:original._id
        });
        await reply.save();

        // answering a message is as good as reading it, so the sender does not
        // have to press Mark As Read afterwards. The new state goes back to the
        // client so the unread badge stays in step.
        if(!original.read){
            original.read = true;
            await original.save();
        }

        return new Response(JSON.stringify({
            message:'Reply Sent',
            read:original.read,
            reply:{
                _id:reply._id,
                body:reply.body,
                createdAt:reply.createdAt
            }
        }),{status:200});
    }catch(error){
        console.log(error);
        return new Response(JSON.stringify({message:'Something went wrong'}),{status:500});
    }
}
