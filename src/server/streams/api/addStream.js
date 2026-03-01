import { isStreamExists, addStreamInstance } from "$server/streams/console";
import z from "zod";
import { prisma } from "$server/prisma";

/**
 * @param {{}} data
 * @return {Promise<{success: boolean, message: string, data?: {}}>}
 */
export const actions = async (data) => {
  const TWITCH_URL_REGEX = /^(https?:\/\/)?([a-z0-9]+\.)?twitch\.tv/;
  const YT_URL_REGEX = /^(https?:\/\/)?([a-z0-9]+\.)?(youtube\.com|youtu\.be)/;
  let newPath = "";

  const schema = z.object({
    url: z.string().min(1),
    path: z.string().min(1).toLowerCase(),
  });

  try {
    let newData = await schema.parseAsync(data);

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

    newPath = newData.path;

    let creatorData = await prisma.creator.findFirst({
      select: {
        name: true,
      },
      where: {
        name: newData.path,
      },
    });

    if (!creatorData) {
      creatorData = await prisma.creator.create({
        data: {
          name: newData.path,
        },
      });
    }

    await prisma.activeStreams.upsert({
      where: {
        creatorName: creatorData.name,
      },
      update: {
        status: "Added",
      },
      create: {
        creatorName: creatorData.name,
        status: "Added",
      },
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      let items = [];
      for (const issue of e.issues) {
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
  return {
    success: true,
    message: "Stream instance created successfully!",
    data: {
      eventUrl: `/logs/${newPath}`,
    },
  };
};
