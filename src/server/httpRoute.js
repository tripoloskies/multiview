import z from "zod";
import { prisma } from "$server/prisma";

function randomStringGenerator() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomString = Array.from({ length: 10 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length)),
  ).join("");

  return randomString;
}

function getCORSValues() {
  const port =
    Bun.env.NODE_ENV == "production" ? Bun.env.PROD_PORT : Bun.env.DEV_PORT;
  const protocol = port === "443" ? "https://" : "http://";
  return `${protocol}${Bun.env.HOST}${port !== "80" && port !== "443" ? `:${port}` : ""}`;
}

export const routes = {
  "/api/vod/fetch": {
    /**
     *
     * @param {import("bun").BunRequest} request
     * @returns
     */
    GET: async (request) => {
      /**
       * @type {Bun.BunFile}
       */
      let fp;

      const responseHeaders = new Headers();
      let data = Object.fromEntries(
        new URL(request.url).searchParams.entries(),
      );
      const schema = z.object({
        id: z.string().min(1),
        type: z.string().optional(),
      });

      try {
        let newData = await schema.parseAsync(data);

        let vodProps = await prisma.vodProps.findFirst({
          select: {
            manifestPath: true,
          },
          where: {
            id: newData.id,
          },
        });

        if (!vodProps) {
          return new Response(null, { status: 404 });
        }

        switch (newData?.type) {
          case "thumbnail":
            fp = Bun.file(
              `/mnt/record-storage/${vodProps.manifestPath}/thumbnail.jpg`,
            );
            responseHeaders.set("Content-Type", "image/jpg");
            // imageHeaders.set("Content-Length", fp.size.toString());
            responseHeaders.set("Access-Control-Allow-Origin", getCORSValues());
            break;
          default:
            fp = Bun.file(
              `/mnt/record-storage/${vodProps.manifestPath}/index.mp4`,
            );
            responseHeaders.set("Content-Type", "video/mp4");
            // videoHeaders.set("Content-Length", fpv.size.toString());
            responseHeaders.set("Access-Control-Allow-Origin", getCORSValues());
        }

        return new Response(fp, {
          headers: responseHeaders,
        });
      } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
          return Response.json(
            { success: false },
            {
              status: 400,
            },
          );
        } else {
          return new Response("null");
        }
      }
    },
  },
  "/api/vod/publish": {
    /**
     *
     * @param {import("bun").BunRequest} request
     * @returns
     */
    POST: async (request) => {
      let stremVodId = "";
      const data = Object.fromEntries((await request.formData()).entries());
      const schema = z.object({
        id: z.string().min(1),
      });

      try {
        let newData = await schema.parseAsync(data);

        let creatorData = await prisma.creator.findFirst({
          select: {
            name: true,
          },
          where: {
            name: newData.id,
          },
        });

        if (!creatorData) {
          return new Response("not_exist");
        }

        while (true) {
          stremVodId = randomStringGenerator();
          let existingStream = await prisma.vodProps.findFirst({
            select: {
              id: true,
            },
            where: {
              id: stremVodId,
            },
          });

          if (existingStream) {
            continue;
          }
          break;
        }

        let manifestPath = `${creatorData.name}/${stremVodId}`;
        await prisma.vodProps.create({
          data: {
            id: stremVodId,
            creatorName: creatorData.name,
            manifestPath: manifestPath,
            datePublished: new Date().toISOString(),
          },
        });
        return new Response(manifestPath);
      } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
          return new Response("null");
        } else {
          return new Response("null");
        }
      }
    },
  },
  "/api/inform": {
    /**
     *
     * @param {import("bun").BunRequest} request
     * @returns
     */
    POST: async (request) => {
      const data = Object.fromEntries((await request.formData()).entries());

      const schema = z.object({
        id: z.string().min(1),
        action: z.enum(["Update", "Delete"]),
        status: z.string().min(1),
      });

      try {
        let newData = await schema.parseAsync(data);

        let creatorData = await prisma.creator.findFirst({
          select: {
            name: true,
          },
          where: {
            name: newData.id,
          },
        });

        if (!creatorData) {
          creatorData = await prisma.creator.create({
            data: {
              name: newData.id,
            },
          });
        }

        switch (newData.action) {
          case "Update":
            await prisma.activeStreams.upsert({
              where: {
                creatorName: creatorData.name,
              },
              update: {
                status: newData.status,
              },
              create: {
                creatorName: newData.id,
                status: newData.status,
              },
            });
            break;
          case "Delete":
            await prisma.activeStreams.delete({
              where: {
                creatorName: creatorData.name,
              },
            });
            break;
          default:
            return new Response("-2");
        }
        return new Response("1");
      } catch (error) {
        console.error(error);
        if (error instanceof z.ZodError) {
          return new Response("-1");
        } else {
          return new Response("-3");
        }
      }
    },
  },
};
