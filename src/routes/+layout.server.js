/** @type {import('./$types').LayoutServerLoad} */
export async function load({ locals }) {
  return {
    host: locals.host,
    recordPath: locals.recordPath
  };
}
