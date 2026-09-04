import {Schema,model,models} from 'mongoose';

const ReviewSchema = new Schema({
    // every review hangs off a completed booking, that is what stops
    // people from reviewing a property they never stayed at
    booking:{
        type:Schema.Types.ObjectId,
        ref:'Booking',
        required:true,
        unique:true
    },
    property:{
        type:Schema.Types.ObjectId,
        ref:'Property',
        required:true
    },
    author:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    rating:{
        type:Number,
        required:[true,'Rating is required'],
        min:1,
        max:5
    },
    title:{
        type:String
    },
    body:{
        type:String
    }
},{timestamps:true});

// newest reviews first when we list them on a property page
ReviewSchema.index({property:1,createdAt:-1});

const Review = models.Review || model('Review',ReviewSchema);

export default Review;
