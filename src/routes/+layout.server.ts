import type { LayoutServerLoad } from "./$types.js";

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    host: locals.host,
    recordPath: locals.recordPath,
  };
};
