import { error } from "@sveltejs/kit";
import { randomUUIDv7 } from "bun";

/**
 * @type {import('@sveltejs/kit').Handle}
 */
export const handle = async ({ event, resolve }) => {
  let sessionId = event.cookies.get("sessionId");
  const isHttps = event.url.protocol === "https:";

  // Check all .env configs
  if (!process.env?.HOST) {
    error(500, "Missing environment configuration.");
  }

  if (!sessionId) {
    sessionId = randomUUIDv7();
    event.cookies.set("sessionId", sessionId, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: isHttps,
    });
  }

  event.locals.sessionId = sessionId;
  event.locals.host = process.env.HOST;

  return resolve(event);
};
