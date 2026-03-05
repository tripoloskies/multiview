import { isStreamExists, addStreamInstance } from "$instance/client";
import z from "zod";
import { prisma } from "$database/client";
import type { wsActions } from "$websocket/websocket";

export const actions: wsActions = async (data) => {
  const TWITCH_URL_REGEX: RegExp = /^(https?:\/\/)?([a-z0-9]+\.)?twitch\.tv/;
  const YT_URL_REGEX: RegExp =
    /^(https?:\/\/)?([a-z0-9]+\.)?(youtube\.com|youtu\.be)/;

  const schema = z.object({
    url: z.string().min(1),
    path: z.string().min(1).toLowerCase(),
  });

  try {
    const newData = await schema.parseAsync(data);

    if (YT_URL_REGEX.test(newData.url)) {
      newData.path = "yt/" + newData.path;
    } else if (TWITCH_URL_REGEX.test(newData.url)) {
      newData.path = "twitch/" + newData.path;
    } else {
      newData.path = "others/" + newData.path;
    }

    if (await isStreamExists(newData.path)) {
      return {
        success: false,
        message: `Adding stream denied. Stream ${newData.path} is currently active.`,
      };
    }
    await addStreamInstance(newData.url, newData.path);

    const newPath: string = newData.path;

    await prisma.activeStreams.upsert({
      where: {
        creatorName: newData.path,
      },
      update: {
        status: "Added",
      },
      create: {
        creator: {
          connectOrCreate: {
            where: {
              name: newData.path,
            },
            create: {
              name: newData.path,
            },
          },
        },
        status: "Added",
      },
    });

    return {
      success: true,
      message: "Stream instance created successfully!",
      data: {
        eventUrl: `/api/instance/logs?path=${encodeURIComponent(newPath)}`,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const items: PropertyKey[] = [];
      for (const issue of error.issues) {
        items.push(...issue.path);
      }
      return {
        success: false,
        message: `Please complete the fields. ${items.join(", ")}`,
      };
    }
    return {
      success: false,
      message: "There's a problem when creating a stream instance.",
    };
  }
};
