import mongoose from "mongoose";
import { setServers } from "node:dns";

setServers(["8.8.8.8", "1.1.1.1"]);
export interface DatabaseConfig {
  uri: string;
  dbName: string;
}
export const connectDatabase = async (
  config: DatabaseConfig,
): Promise<void> => {
  await mongoose.connect(config.uri, {
    dbName: config.dbName,
    serverSelectionTimeoutMS: 5000,
  });
  console.log("Conexión con MongoDB establecida.");
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log("Conexión con MongoDB cerrada.");
};
