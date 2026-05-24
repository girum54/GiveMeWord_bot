import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import * as schema from "./schema";

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Connection for queries (pool)
const queryClient = postgres(connectionString);

export const db = drizzle(queryClient, { schema });

// Export for migration scripts that need to close the connection
export const closeConnection = async () => {
  await queryClient.end();
};
