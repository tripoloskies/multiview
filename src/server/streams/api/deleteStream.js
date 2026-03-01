import { deleteStreamInstance } from "$server/streams/console";
import z from "zod";
import { prisma } from "$server/prisma";
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

    let creatorData = await prisma.creator.findFirst({
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
        status: "Deleting...",
      },
      create: {
        creatorName: creatorData.name,
        status: "Deleting...",
      },
    });

    await deleteStreamInstance(newData.path);

    await new Promise((resolve) => {
      setTimeout(() => resolve(true), 500);
    });

    try {
      await prisma.activeStreams.delete({
        where: {
          creatorName: creatorData.name,
        },
      });
      // eslint-disable-next-line no-unused-vars
    } catch (e) {
      // There's a race condition between deleting activeStreams here and deleting streams from "stream-create.sh" while on exit or force exit.
      // Ignore the errors and move forward.
    }
    return {
      success: true,
      message: `Instance ${newData.path} deleted successfully.`,
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
      message: "There's a problem when deleting a stream instance.",
    };
  }
};
