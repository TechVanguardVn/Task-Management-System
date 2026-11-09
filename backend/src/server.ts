import express from "express";
import { prisma } from "./db";

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.get("/api/v1/health", async (_req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch {
    res.status(503).json({ status: "error", database: "unavailable" });
  }
});

const server = app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});

function shutdown() {
  server.close(() => void prisma.$disconnect());
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
