import {Schema,model,models} from 'mongoose';

const UserSchema = new Schema({
    email:{
        type:String,
        unique:[true,'Email already exists'],
        required:[true,'Email is required']
    },
    username:{
        type:String,
        required:[true,'Username is required']
    },
    image:{
        type:String
    },
    // tenant  -> can browse, bookmark and message (default for a new signup)
    // landlord-> everything a tenant can do, plus listing properties
    // admin   -> everything, plus the moderation panel at /admin
    role:{
        type:String,
        enum:['tenant','landlord','admin'],
        default:'tenant'
    },
    bookmarks:[
        {
            type:Schema.Types.ObjectId,
            ref:'Property'
        }
    ],  
},{timestamps:true});

const User = models.User || model('User',UserSchema);

export default User;