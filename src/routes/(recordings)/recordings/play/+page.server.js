import { prisma } from "$lib/prisma";
import { redirect } from "@sveltejs/kit";
import z, { string } from "zod";

/** @type {import('./$types').PageServerLoad} */
export async function load({ url, locals }) {
  const query = Object.fromEntries(url.searchParams.entries());

  const schema = z.object({
    id: string().min(1),
  });

  try {
    const sanitizedQuery = await schema.parseAsync(query);

    const data = await prisma.vodProps.findFirst({
      where: {
        id: sanitizedQuery.id,
      },
    });

    if (!data) {
      redirect(302, "/recordings");
    }

    return {
      id: data.id,
      title: new Date(data.datePublished).toTimeString(),
      mediaUrl: `http://${locals.host}:3000/api/vod/fetch?id=${data.id}`,
    };
  } catch (e) {
    if (e instanceof z.ZodError) {
      redirect(302, "/recordings");
    }
    throw e;
  }
}
