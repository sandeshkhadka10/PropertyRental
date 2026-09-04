import mongoose from 'mongoose';
import Property from '@/models/Property';
import Review from '@/models/Review';

// Recalculates a property's average rating from its reviews and stores the
// result on the property itself. Called after a review is created, edited or
// deleted. Denormalising it this way keeps the property cards and the
// 'sort by rating' query cheap, since neither has to touch the reviews.
export const updatePropertyRating = async (propertyId) => {
    const [stats] = await Review.aggregate([
        {
            $match:{property: new mongoose.Types.ObjectId(String(propertyId))}
        },
        {
            $group:{
                _id:'$property',
                avg:{$avg:'$rating'},
                count:{$sum:1}
            }
        }
    ]);

    await Property.findByIdAndUpdate(propertyId,{
        // one decimal place is all we ever show
        rating_avg: stats ? Math.round(stats.avg * 10) / 10 : 0,
        rating_count: stats ? stats.count : 0
    });
};
