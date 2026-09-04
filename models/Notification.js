import {Schema,model,models} from 'mongoose';

// Every notification the app can raise. Kept as an enum so a typo in a route
// fails loudly at save time instead of quietly creating a row nothing renders.
export const NOTIFICATION_TYPES = [
    // listings
    'property_submitted',       // to the owner: your listing is awaiting review
    'property_pending_review',  // to the admins: a new listing needs moderating
    'property_approved',
    'property_rejected',
    'property_flagged',
    'property_removed',         // the listing was deleted by an admin
    // bookings
    'booking_requested',        // to the owner: someone wants to stay
    'booking_confirmed',        // to the guest: the owner accepted
    'booking_declined',         // to the guest: a pending request was turned down
    'booking_cancelled',        // to whichever side did not press cancel
    'booking_completed'
];

const NotificationSchema = new Schema({
    // who this lands on. Everything is read through this field, so it leads
    // both indexes below.
    recipient:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    // who caused it, when there is such a person. Left unset for anything the
    // system raised on its own.
    actor:{
        type:Schema.Types.ObjectId,
        ref:'User'
    },
    type:{
        type:String,
        enum:NOTIFICATION_TYPES,
        required:true
    },
    title:{
        type:String,
        required:true
    },
    body:{
        type:String
    },
    // where the bell should take the reader. Stored rather than derived so an
    // old notification keeps pointing somewhere sensible even after the
    // routes around it move.
    link:{
        type:String
    },
    property:{
        type:Schema.Types.ObjectId,
        ref:'Property'
    },
    booking:{
        type:Schema.Types.ObjectId,
        ref:'Booking'
    },
    read:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

// the unread badge, and the list itself
NotificationSchema.index({recipient:1,read:1});
NotificationSchema.index({recipient:1,createdAt:-1});

const Notification = models.Notification || model('Notification',NotificationSchema);

export default Notification;
