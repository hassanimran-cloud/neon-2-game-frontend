import mongoose from "mongoose";

export async function connectDb(uri) {
  if (!uri) {
    console.warn("MONGODB_URI missing — match history will not be saved.");
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log("MongoDB connected");
    return true;
  } catch (err) {
    console.warn("MongoDB connection failed — matches will still run in memory.", err.message);
    return false;
  }
}
