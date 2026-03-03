import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../../generated/prisma/client";
const adapter: PrismaLibSql = new PrismaLibSql({
  url: Bun.env.DATABASE_URL ?? "",
});
const prisma: PrismaClient = new PrismaClient({ adapter });

export { prisma };
