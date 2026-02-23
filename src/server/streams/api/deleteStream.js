import { deleteStreamInstance } from "$server/streams/console";
import z from "zod";
import { db } from "$server/database";
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
    db.query("UPDATE streams SET status=$status WHERE id=$id").run({
      $id: newData.path,
      $status: "Deleting...",
    });
    await deleteStreamInstance(newData.path);

    await new Promise((resolve) => {
      setTimeout(() => resolve(true), 500);
    });
    db.prepare(`DELETE from streams WHERE id=$id`).run({ $id: newData.path });
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
