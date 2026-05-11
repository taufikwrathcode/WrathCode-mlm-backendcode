import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
// connect mogoose
export const connectdb = async () => {
  try {
    const db_url = process.env.mongoose_url;
    if (!db_url) {
      console.error("mongoose_url not found in .env file");
      return;
    }
    await mongoose.connect(db_url);
    console.log(" Mongodb Connected to :-", mongoose.connection.name);
  } catch (error) {
    console.error(" mongodb not connected", error.message);
  }
};

