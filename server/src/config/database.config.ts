import mongoose from "mongoose";
import dns from "dns";

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined");
    }

    // Dynamic DNS fallback for mongodb+srv connections when local resolver fails to lookup SRV records
    if (mongoURI.startsWith("mongodb+srv://")) {
      try {
        const host = mongoURI.split("@")[1]?.split("/")[0]?.split("?")[0];
        if (host) {
          await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
        }
      } catch (dnsError) {
        console.log("DNS SRV resolution failed using local system DNS. Setting public DNS fallback (8.8.8.8, 1.1.1.1)...");
        dns.setServers(["8.8.8.8", "1.1.1.1"]);
      }
    }

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

export default connectDB;