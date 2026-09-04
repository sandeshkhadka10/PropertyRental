import {Schema,model,models} from 'mongoose';

const MessageSchema = new Schema({
    sender:{
        type: Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    recipient:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    property:{
        type:Schema.Types.ObjectId,
        ref:'Property',
        required:true
    },
    name:{
        type:String,
        required:[true,'Name is required']
    },
    email:{
        type:String,
        required:[true,'Email is required']
    },
    phone:{
        type:String
    },
    body:{
        type:String
    },
    // set when this message was written as a reply from the messages page and
    // points at the message being answered, so the reader sees what it is about
    replyTo:{
        type:Schema.Types.ObjectId,
        ref:'Message'
    },
    read:{
        // to mark the message if read
        type:Boolean,
        default:false
    }
},{timestamps:true});

const Message = models.Message || model('Message',MessageSchema);

export default Message;