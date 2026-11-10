import { app } from "./app";
import { prisma } from "./db";

const port = Number(process.env.PORT ?? 3000);

const server = app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});

function shutdown() {
  server.close(() => void prisma.$disconnect());
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
