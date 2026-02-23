import { Database } from "bun:sqlite";

export const db = new Database("./db/server.sqlite");

db.query(
  `
  CREATE TABLE IF NOT EXISTS streams (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL
  )
`,
).run();
