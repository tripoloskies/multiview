import { deleteStreamInstance } from "$instance/client";
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
        status: "Deleting...",
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
        status: "Deleting...",
      },
    });

    await deleteStreamInstance(newData.path);

    await Bun.sleep(500);

    await prisma.activeStreams.deleteMany({
      where: {
        creatorName: newData.path,
      },
    });
    return {
      success: true,
      message: `Instance ${newData.path} deleted successfully.`,
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
      message: "There's a problem when deleting a stream instance.",
    };
  }
};
