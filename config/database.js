import mongoose from "mongoose";

let connected = false;

const connectDB = async()=>{
    // Mongoose ignores fields that are not in the schema.
    mongoose.set('strictQuery',true);

    // If the database is already connected, don't connect again
    if(connected){
        console.log("MongoDB is already connected...");
    }

    // Connect to MongoDB
    try{
        await mongoose.connect(process.env.MONGODB_URL);
        connected = true;
        console.log("MongoDB connected");
    }catch(error){
        console.log(error);
    }
};

export default connectDB;