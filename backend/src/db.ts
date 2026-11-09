import "dotenv/config";
import { existsSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const rawConnectionString = process.env.DATABASE_URL;
if (!rawConnectionString) {
  throw new Error("Set DATABASE_URL in backend/.env.");
}

function normalizeConnectionString(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const sslRootCert = parsed.searchParams.get("sslrootcert");
    if (sslRootCert && !existsSync(sslRootCert)) {
      parsed.searchParams.delete("sslrootcert");
      parsed.searchParams.set("sslmode", "require");
    }

    const sslMode = parsed.searchParams.get("sslmode");
    if (
      (sslMode === "require" || sslMode === "prefer") &&
      !parsed.searchParams.has("uselibpqcompat") &&
      !parsed.searchParams.has("sslrootcert")
    ) {
      parsed.searchParams.set("uselibpqcompat", "true");
    }

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: normalizeConnectionString(rawConnectionString),
    connectionTimeoutMillis: 5000,
  }),
});
