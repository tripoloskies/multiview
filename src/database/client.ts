import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../../generated/prisma/client";
const adapter: PrismaLibSql = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "",
});
const prisma: PrismaClient = new PrismaClient({ adapter });

export { prisma };
