import { Glob } from "bun";
import { dirname } from "node:path";
import z from "zod";
import { prisma } from "$database/client";
import { rm } from "node:fs/promises";
import {
  SEGMENT_REGEX,
  getCORSValues,
  randomStringGenerator,
} from "$lib/utils/browser";

const _server = Bun.serve({
  port: 3002,
  routes: {
    "/api/vod/fetch/:id/:filename": {
      GET: async (request: Bun.BunRequest) => {
        /**
         * @type {Bun.BunFile}
         */
        let fp;

        const responseHeaders = new Headers();
        const data = { ...request.params };

        const fileLists = new Glob(
          `${Bun.env.RECORD_PATH}/**/${data.id}/index.m3u8`,
        );
        let path = "";
        for await (const file of fileLists.scan(".")) {
          path = dirname(file);
          break;
        }

        if (SEGMENT_REGEX.test(data.filename)) {
          fp = Bun.file(`${path}/segments/${data.filename}`);
          responseHeaders.set("Content-Type", "video/m2ts");
          // videoHeaders.set("Content-Length", fpv.size.toString());
          responseHeaders.set("Access-Control-Allow-Origin", getCORSValues());
        } else if (data.filename === "index.m3u8") {
          await new Promise((resolve) => setTimeout(() => resolve(true), 100));
          fp = Bun.file(`${path}/${data.filename}`);
          responseHeaders.set("Content-Type", "application/vnd.apple.mpegurl");
          // videoHeaders.set("Content-Length", fpv.size.toString());
          responseHeaders.set("Access-Control-Allow-Origin", getCORSValues());
        } else if (data.filename === "thumbnail.jpg") {
          fp = Bun.file(`${path}/${data.filename}`);
          responseHeaders.set("Content-Type", "image/jpg");
          // videoHeaders.set("Content-Length", fpv.size.toString());
          responseHeaders.set("Access-Control-Allow-Origin", getCORSValues());
        } else {
          return new Response(null, { status: 404 });
        }

        if (!(await fp.exists())) {
          return new Response(null, { status: 404 });
        }

        return new Response(fp, {
          headers: responseHeaders,
        });
      },
    },
    "/api/vod/verify": {
      POST: async (request: Bun.BunRequest) => {
        const data = Object.fromEntries((await request.formData()).entries());
        const schema = z.object({
          id: z.string().min(1),
        });

        try {
          const newData = await schema.parseAsync(data);
          const vodData = await prisma.vodProps.findFirst({
            select: {
              id: true,
              manifestPath: true,
            },
            where: {
              id: newData.id,
            },
          });

          if (!vodData) {
            return new Response("-1");
          }

          const path = `${Bun.env.RECORD_PATH}/${vodData.manifestPath}`;
          const videoPath = `${path}/index.m3u8`;
          const imagePath = `${path}/thumbnail.jpg`;

          if (
            !(await Bun.file(videoPath).exists()) ||
            !(await Bun.file(imagePath).exists())
          ) {
            await prisma.vodProps.deleteMany({
              where: {
                id: vodData.id,
              },
            });
            await rm(path, { force: true, recursive: true });
          }

          return new Response("0");
        } catch (error) {
          console.error(error);
          if (error instanceof z.ZodError) {
            return new Response("-2");
          } else {
            return new Response("-3");
          }
        }
      },
    },
    "/api/vod/publish": {
      POST: async (request: Bun.BunRequest) => {
        const data = Object.fromEntries((await request.formData()).entries());
        const schema = z.object({
          id: z.string().min(1),
        });

        try {
          const newData = await schema.parseAsync(data);

          const creatorData = await prisma.creator.findFirst({
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

          let streamVodId: string = "";

          while (true) {
            streamVodId = randomStringGenerator();
            const existingStream = await prisma.vodProps.findFirst({
              select: {
                id: true,
              },
              where: {
                id: streamVodId,
              },
            });

            if (existingStream) {
              continue;
            }
            break;
          }

          const manifestPath = `${creatorData.name}/${streamVodId}`;
          await prisma.vodProps.create({
            data: {
              id: streamVodId,
              creatorName: creatorData.name,
              manifestPath: manifestPath,
              datePublished: new Date().toISOString(),
            },
          });
          return new Response(streamVodId);
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
  },
});

console.log(`Websocket Server: Listening ${_server.hostname}:${_server.port}`);
