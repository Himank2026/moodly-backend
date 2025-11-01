import mongoose from "mongoose";

const connectDB=async()=>{
    try{
    await mongoose.connect(process.env.mongo_URL);
    console.log("MONGODB IS CONNECTED 😋");
    }
    catch(err){
     console.log("MONGODB CONNECTION ERROR!",err);
    }
};
export default connectDB;