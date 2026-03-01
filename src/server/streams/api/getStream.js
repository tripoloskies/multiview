import { getStreamInstance } from "$server/streams/console";
import z from "zod";
import { prisma } from "$server/prisma";

/**
 *
 * @param {string} url
 * @return {Promise<boolean>}
 */
async function urlTest(url) {
  try {
    const response = await fetch(url);
    return response.status === 200;
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return false;
  }
}
/**
 * @param {{}} data
 * @return {Promise<{success: boolean, message: string, data?: {}}>}
 */
export const actions = async (data) => {
  const schema = z.object({
    path: z.string().min(1),
  });
  try {
    let newData = await schema.parseAsync(data);
    let instance = await getStreamInstance(newData.path);
    let mediaUrl = `http://${Bun.env.HOST}:8888/${newData.path}/index.m3u8`;
    if (!instance.length) {
      return {
        success: false,
        message: `Instance ${newData.path} not found`,
      };
    }

    const activeStreamsData = await prisma.activeStreams.findFirst({
      select: {
        status: true,
      },
      where: {
        creatorName: newData.path,
      },
    });

    if (!activeStreamsData) {
      return {
        success: false,
        message: "No status for this?",
      };
    }
    return {
      success: true,
      message: `OK`,
      data: {
        status: activeStreamsData.status,
        url: mediaUrl,
        online: await urlTest(mediaUrl),
        instance: instance,
      },
    };
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
      message: "Not ok.",
    };
  }
};
