import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDb = async ()=>{
    try {
        const connectioninstatnce = await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
        console.log(`\n MongoDb connected !! DB HOST :${connectioninstatnce.connection.host} `);
        
    } catch (error) {
        console.error("MONGODB CONNECTION ERROR : ", error);
        process.exit(1)
    }
}

export default connectDb;