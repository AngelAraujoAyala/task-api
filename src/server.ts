import dns from "dns"
dns.setDefaultResultOrder("ipv4first");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import "dotenv/config";
import type { Server } from "node:http";
import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { loadEnvironment } from "./config/env.js";

let isShuttingDown = false;

const closeHttpServer = (server: Server): Promise<void> => {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

const shutdown = async (server: Server, signal: string): Promise<void> => {
  if (isShuttingDown) {
    return;
  }
  isShuttingDown = true;
  console.log(`Señal ${signal} recibida. Cerrando la API...`);

  try {
    await closeHttpServer(server);
    await disconnectDatabase();
    console.log("Cierre ordenado completado.");
    process.exitCode = 0;
  } catch {
    console.error("Ocurrió un problema durante el cierre de la API.");
    process.exitCode = 1;
  }
};

const startServer = async (): Promise<void> => {
  try {
    const env = loadEnvironment();
    await connectDatabase({
      uri: env.mongodbUri,
      dbName: env.mongodbDbName,
    });

    const server = app.listen(env.port, () => {
      console.log(`API disponible en http://localhost:${env.port}`);
    });

    process.on("SIGINT", () => {
      void shutdown(server, "SIGINT");
    });
    process.on("SIGTERM", () => {
      void shutdown(server, "SIGTERM");
    });
  } catch {
    console.error(
      "No fue posible iniciar la API. Revise MONGODB_URI, " +
        "el usuario y la lista de acceso de red.",
    );
    process.exitCode = 1;
  }
};

void startServer();
