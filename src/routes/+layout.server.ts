import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals, url }) => {
  return {
    rootUrl: `${url.protocol}//${locals.host}`,
    eventRootUrl: `${url.protocol}//${locals.host}:8080`,
    wsRootUrl: `ws://${url.hostname}:3000`,
    recordPath: locals.recordPath,
  };
};
