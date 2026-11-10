import { argon2id, hash } from "argon2";
import { prisma } from "../src/db";

const KHANG_ID = "f72f0e2f-900d-4a86-b7f5-e80846db6f14";
const KHANG_EMAIL = "khanganduc@gmail.com";
const KHANG_FALLBACK_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$xVdqonm+6301RRnMj80T4A$dZe9jj0FOM2QeHd9+/RUskhRjxy4mgt2FJNOpfuKhr0";

const SECOND_USER_EMAIL = "user@gmail.com";
const SECOND_USER_NAME = "Chí Dũng";
const SECOND_USER_PASSWORD = "123456789";

function daysFromToday(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + days));
}

try {
  // Remove legacy demo user if present
  await prisma.user.deleteMany({
    where: { email: "demo@example.test" },
  });

  // 1. Preserve khanganduc@gmail.com account (and its active sessions/password), update projects & tasks
  const khangUser = await prisma.user.upsert({
    where: { email: KHANG_EMAIL },
    update: {},
    create: {
      id: KHANG_ID,
      email: KHANG_EMAIL,
      name: "Hoàng Khang",
      passwordHash: KHANG_FALLBACK_HASH,
    },
  });

  await prisma.project.deleteMany({
    where: { ownerId: khangUser.id },
  });

  await prisma.project.create({
    data: {
      ownerId: khangUser.id,
      name: "E-Commerce Web Platform",
      description:
        "Full-stack online retail storefront with product catalog, shopping cart, Stripe checkout integration, and order tracking.",
      color: "#2563eb",
      status: "ACTIVE",
      startDate: daysFromToday(-7),
      dueDate: daysFromToday(20),
      tasks: {
        create: [
          {
            title: "Design responsive storefront UI and product catalog grid",
            description:
              "Create reusable product cards, category filter sidebar, and mobile-first navigation header using Tailwind CSS.",
            status: "DONE",
            priority: "MEDIUM",
            dueDate: daysFromToday(-3),
          },
          {
            title: "Implement authentication and customer profile management",
            description:
              "Set up secure session authentication with Argon2 password hashing, CSRF protection, and saved shipping addresses.",
            status: "DONE",
            priority: "HIGH",
            dueDate: daysFromToday(-1),
          },
          {
            title: "Build shopping cart state and persistent checkout drawer",
            description:
              "Support quantity updates, promo code validation, and real-time subtotal calculation across browser sessions.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromToday(2),
          },
          {
            title: "Integrate Stripe payment gateway and webhook handlers",
            description:
              "Configure payment intents, handle checkout session completion events, and update order payment statuses.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromToday(5),
          },
          {
            title: "Develop full-text product search and multi-attribute filtering",
            description:
              "Add PostgreSQL indexed search by keyword, price range, brand, and customer rating with paginated API responses.",
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromToday(9),
          },
          {
            title: "Create admin order fulfillment and inventory dashboard",
            description:
              "Allow store managers to track low-stock alerts, update shipment tracking numbers, and export sales reports.",
            status: "TODO",
            priority: "LOW",
            dueDate: daysFromToday(14),
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      ownerId: khangUser.id,
      name: "AI Customer Support Portal",
      description:
        "Intelligent helpdesk and ticket routing platform powered by RAG knowledge base search and real-time agent handoff.",
      color: "#7c3aed",
      status: "ACTIVE",
      startDate: daysFromToday(-5),
      dueDate: daysFromToday(25),
      tasks: {
        create: [
          {
            title: "Set up document ingestion pipeline and vector embeddings",
            description:
              "Parse product documentation into semantic chunks and index embeddings in PostgreSQL with pgvector.",
            status: "DONE",
            priority: "HIGH",
            dueDate: daysFromToday(-2),
          },
          {
            title: "Build conversational chat widget with streaming responses",
            description:
              "Implement Server-Sent Events (SSE) for low-latency token streaming and markdown citation rendering.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromToday(3),
          },
          {
            title: "Implement automated ticket triage and priority classification",
            description:
              "Classify incoming customer inquiries by sentiment and urgency to route critical issues to senior agents.",
            status: "IN_PROGRESS",
            priority: "MEDIUM",
            dueDate: daysFromToday(6),
          },
          {
            title: "Create human agent workspace and live escalation queue",
            description:
              "Provide support agents with conversation summaries, suggested replies, and one-click ticket resolution.",
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromToday(11),
          },
          {
            title: "Add resolution analytics and CSAT feedback survey",
            description:
              "Track first-response time, AI deflection rate, and post-resolution customer satisfaction scores.",
            status: "TODO",
            priority: "LOW",
            dueDate: daysFromToday(16),
          },
        ],
      },
    },
  });

  // 2. Create/Update second account: user@gmail.com (Chí Dũng)
  const secondUserPasswordHash = await hash(SECOND_USER_PASSWORD, { type: argon2id });
  const secondUser = await prisma.user.upsert({
    where: { email: SECOND_USER_EMAIL },
    update: {
      name: SECOND_USER_NAME,
      passwordHash: secondUserPasswordHash,
    },
    create: {
      email: SECOND_USER_EMAIL,
      name: SECOND_USER_NAME,
      passwordHash: secondUserPasswordHash,
    },
  });

  await prisma.project.deleteMany({
    where: { ownerId: secondUser.id },
  });

  await prisma.project.create({
    data: {
      ownerId: secondUser.id,
      name: "FinTech Personal Expense Tracker",
      description:
        "Smart personal finance and budgeting web app with multi-currency wallets, recurring bill alerts, and cashflow analytics.",
      color: "#16a34a",
      status: "ACTIVE",
      startDate: daysFromToday(-6),
      dueDate: daysFromToday(18),
      tasks: {
        create: [
          {
            title: "Design database schema for multi-currency accounts and ledgers",
            description:
              "Model double-entry transactions, category hierarchies, and monthly budget thresholds with strict integrity constraints.",
            status: "DONE",
            priority: "HIGH",
            dueDate: daysFromToday(-3),
          },
          {
            title: "Build interactive cashflow and category breakdown charts",
            description:
              "Visualize monthly income versus expenses, savings rate trends, and top spending categories on the main dashboard.",
            status: "DONE",
            priority: "MEDIUM",
            dueDate: daysFromToday(-1),
          },
          {
            title: "Implement CSV bank statement import and auto-categorization",
            description:
              "Parse uploaded transaction files, detect duplicate entries, and assign spending categories using keyword rules.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromToday(2),
          },
          {
            title: "Develop recurring subscription tracker and bill reminders",
            description:
              "Notify users 3 days before upcoming utility bills or subscription renewals and log scheduled payments.",
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromToday(7),
          },
          {
            title: "Add monthly PDF financial report export",
            description:
              "Generate downloadable monthly statements summarizing net worth changes, budget variance, and tax-deductible items.",
            status: "TODO",
            priority: "LOW",
            dueDate: daysFromToday(13),
          },
        ],
      },
    },
  });

  await prisma.project.create({
    data: {
      ownerId: secondUser.id,
      name: "Healthcare Telemedicine & Booking System",
      description:
        "Digital clinic platform for doctor appointment scheduling, virtual video consultations, and electronic medical records.",
      color: "#ea580c",
      status: "ACTIVE",
      startDate: daysFromToday(-4),
      dueDate: daysFromToday(22),
      tasks: {
        create: [
          {
            title: "Create doctor directory and specialty search interface",
            description:
              "Allow patients to filter physicians by medical specialty, clinic location, insurance coverage, and available time slots.",
            status: "DONE",
            priority: "MEDIUM",
            dueDate: daysFromToday(-2),
          },
          {
            title: "Implement real-time appointment slot booking engine",
            description:
              "Prevent double-booking using PostgreSQL row-level locking and handle timezone conversions for remote patients.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromToday(3),
          },
          {
            title: "Integrate WebRTC video consultation room for virtual visits",
            description:
              "Build secure peer-to-peer video call rooms with waiting lobby, screen sharing, and in-call chat notes.",
            status: "IN_PROGRESS",
            priority: "HIGH",
            dueDate: daysFromToday(6),
          },
          {
            title: "Build electronic prescription and medical history module",
            description:
              "Enable doctors to issue digital prescriptions, record clinical notes, and attach lab test results securely.",
            status: "TODO",
            priority: "MEDIUM",
            dueDate: daysFromToday(10),
          },
          {
            title: "Set up automated email and SMS appointment reminders",
            description:
              "Send confirmation notices, 24-hour pre-visit reminders, and easy rescheduling links to reduce patient no-shows.",
            status: "TODO",
            priority: "LOW",
            dueDate: daysFromToday(15),
          },
        ],
      },
    },
  });

  console.log(`Seeded projects and tasks for ${KHANG_EMAIL} and ${SECOND_USER_EMAIL}.`);
} finally {
  await prisma.$disconnect();
  process.exit(0);
}
