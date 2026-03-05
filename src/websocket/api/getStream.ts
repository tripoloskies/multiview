import { getStreamInstance } from "$instance/client";
import z from "zod";
import { prisma } from "$database/client";
import type { wsActions } from "$websocket/websocket";

async function urlTest(url: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    return response.status === 200;
  } catch {
    return false;
  }
}

export const actions: wsActions = async (data) => {
  const schema = z.object({
    path: z.string().min(1),
  });
  try {
    const newData = await schema.parseAsync(data);
    const instance = await getStreamInstance(newData.path);
    const mediaUrl: string = `http://${Bun.env.HOST}:8888/${newData.path}/index.m3u8`;
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
      message: "Not ok.",
    };
  }
};
