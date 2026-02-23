/** @type {import('./$types').PageLoad} */
export async function load({ params }) {
  return {
    path: params.path,
  };
}
