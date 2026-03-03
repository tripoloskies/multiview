import { error, type Handle } from "@sveltejs/kit";
import { v7 as randomUUIDv7 } from "uuid";

export const handle: Handle = async ({ event, resolve }) => {
  let sessionId: string | undefined = event.cookies.get("sessionId");
  const isHttps: boolean = event.url.protocol === "https:";

  // Check critical .env configs
  if (!Bun.env?.HOST || !Bun.env?.RECORD_PATH) {
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

  event.locals.recordPath = Bun.env.RECORD_PATH;
  event.locals.sessionId = sessionId;
  event.locals.host = Bun.env.HOST;

  return resolve(event);
};
