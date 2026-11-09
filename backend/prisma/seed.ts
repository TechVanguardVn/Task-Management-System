import { randomBytes } from "node:crypto";
import { argon2id, hash } from "argon2";
import { prisma } from "../src/db";

const demoId = "1e5ddaaf-5dbe-4dbd-b62a-94fc31cbfabe";
const demoEmail = "demo@example.test";

function daysFromToday(days: number) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

try {
  const demoPassword = randomBytes(24).toString("base64url");
  const passwordHash = await hash(demoPassword, { type: argon2id });
  // Create the sample account and its data together. Preserve edits on subsequent runs.
  const user = await prisma.user.upsert({
    where: { id: demoId },
    select: { passwordHash: true },
    update: {},
    create: {
      id: demoId,
      email: demoEmail,
      name: "Demo User",
      passwordHash,
      projects: {
        create: [
          {
            name: "GiftShop",
            color: "#2563eb",
            tasks: {
              create: [
                { title: "Thiết kế giao diện", status: "DONE", priority: "LOW" },
                { title: "Viết API sản phẩm", status: "IN_PROGRESS", priority: "HIGH", dueDate: daysFromToday(2) },
                { title: "Kiểm thử tìm kiếm", dueDate: daysFromToday(-1) },
              ],
            },
          },
          { name: "Nghiên cứu", color: "#16a34a" },
        ],
      },
    },
  });
  console.log(`Demo account ready: ${demoEmail}`);
  if (user.passwordHash === passwordHash) {
    console.log(`Save this generated demo password: ${demoPassword}`);
  }
} finally {
  await prisma.$disconnect();
}
