import { restartStreamInstance } from "$instance/client";
import z from "zod";
import { prisma } from "$database/client";
import type { wsActions } from "$websocket/websocket";
export const actions: wsActions = async (data) => {
  const schema = z.object({
    path: z.string().min(1),
  });
  try {
    const newData = await schema.parseAsync(data);

    await prisma.activeStreams.upsert({
      where: {
        creatorName: newData.path,
      },
      update: {
        status: "Restarting",
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
        status: "Restarting",
      },
    });

    await restartStreamInstance(newData.path);

    await Bun.sleep(500);

    return {
      success: true,
      message: `Instance ${newData.path} restarted successfully.`,
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
      message: "There's a problem when restarting a stream instance.",
    };
  }
};
