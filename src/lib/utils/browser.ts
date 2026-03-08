export const SEGMENT_REGEX = /^segment\d+\.ts$/;

export function randomStringGenerator(): string {
  const chars: string =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomString = Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");

  return randomString;
}

export function getCORSValues(): string {
  const port =
    Bun.env.NODE_ENV == "production" ? Bun.env.PROD_PORT : Bun.env.DEV_PORT;
  const protocol = port === "443" ? "https://" : "http://";
  return `${protocol}${Bun.env.HOST}${port !== "80" && port !== "443" ? `:${port}` : ""}`;
}
