import { redirect } from "@sveltejs/kit";

/** @type {import('./$types').PageLoad} */
export async function load() {
  redirect(302, "/recordings/1");
}
