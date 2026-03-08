import { prisma } from "$database/client";
import { redirect } from "@sveltejs/kit";
import z, { string } from "zod";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
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
      title: new Date(data.datePublished).toUTCString(),
      mediaUrl: `/api/vod/fetch/${data.id}/index.m3u8`,
    };
  } catch (e) {
    if (e instanceof z.ZodError) {
      redirect(302, "/recordings");
    }
    throw e;
  }
};
