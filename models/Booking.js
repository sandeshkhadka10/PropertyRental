import {Schema,model,models} from 'mongoose';
import {calculateDepositAmount} from '@/utils/depositPricing';

export const BOOKING_STATUSES = ['pending','confirmed','completed','cancelled'];

// Nepali wallets the deposit can be paid through.
export const PAYMENT_GATEWAYS = ['esewa','khalti'];

// due    -> nothing attempted yet
// pending-> sent to the wallet, waiting on the outcome
// paid   -> confirmed against the gateway's own API, not just its redirect
// failed / cancelled -> the attempt ended without money moving; can be retried
export const DEPOSIT_STATUSES = ['due','pending','paid','failed','cancelled','refunded'];

const BookingSchema = new Schema({
    property:{
        type:Schema.Types.ObjectId,
        ref:'Property',
        required:true
    },
    // the user who is staying at the property
    guest:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    // copied from the property at booking time so the owner can be
    // looked up without populating the property on every query
    owner:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    checkIn:{
        type:Date,
        required:[true,'Check-in date is required']
    },
    checkOut:{
        type:Date,
        required:[true,'Check-out date is required']
    },
    // how many days the stay covers, worked out from the two dates above
    days:{
        type:Number,
        required:true
    },
    guests:{
        type:Number,
        default:1,
        min:1
    },
    // how the total was reached e.g. 3 days. Snapshotted at booking time so a
    // later edit to the listing's day rate cannot rewrite an agreed price
    priceBreakdown:[
        {
            unit:{type:String},
            count:{type:Number},
            rate:{type:Number},
            subtotal:{type:Number}
        }
    ],
    totalPrice:{
        type:Number,
        required:true
    },
    // pending  -> guest requested, waiting on the owner
    // confirmed-> owner accepted the request
    // completed-> the stay is over
    // cancelled-> called off by either side, or displaced by a confirmed booking
    status:{
        type:String,
        enum:BOOKING_STATUSES,
        default:'pending'
    },
    // optional message from the guest to the owner
    note:{
        type:String
    },
    // The slice of totalPrice taken up front through eSewa or Khalti once the
    // owner has accepted. Kept as its own sub-object because the money trail
    // outlives the booking's status - a cancelled stay still has to remember
    // what was charged, through which wallet, and against which receipt.
    deposit:{
        // Snapshotted from totalPrice by the hook below, for the same reason
        // priceBreakdown is snapshotted: a later rate edit must not change what
        // the guest was asked to pay.
        amount:{type:Number},
        status:{
            type:String,
            enum:DEPOSIT_STATUSES,
            default:'due'
        },
        gateway:{
            type:String,
            enum:PAYMENT_GATEWAYS
        },
        // Our own idempotency key: sent to eSewa as `transaction_uuid` and to
        // Khalti as `purchase_order_id`, then echoed back on the redirect, which
        // is how an unauthenticated callback is matched to a booking. Sparse
        // because it is only minted when a payment is actually started.
        transactionUuid:{
            type:String,
            unique:true,
            sparse:true
        },
        // Khalti's payment identifier, from /epayment/initiate/
        pidx:{type:String},
        // eSewa `ref_id` / Khalti `transaction_id` - the wallet's own receipt number
        referenceId:{type:String},
        paidAt:{type:Date},
        // Raw verification payload, kept for the receipt view and for working
        // out what happened on a sandbox run that went sideways
        gatewayResponse:{type:Schema.Types.Mixed}
    }
},{timestamps:true});

// Fix the deposit to the agreed total at the moment the booking is written, so
// the routes that create bookings do not each have to remember to do it.
BookingSchema.pre('validate',function(){
    if(this.deposit?.amount == null && Number.isFinite(this.totalPrice)){
        this.deposit.amount = calculateDepositAmount(this.totalPrice);
    }
});

// the two lookups we do the most: a user's trips and a property's calendar
BookingSchema.index({guest:1,status:1});
BookingSchema.index({property:1,status:1,checkIn:1,checkOut:1});

const Booking = models.Booking || model('Booking',BookingSchema);

export default Booking;
