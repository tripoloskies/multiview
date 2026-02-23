import z from "zod";
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
    return {
      success: true,
      message: `Opening instance ${newData.path}...`,
      data: {
        eventUrl: `/logs/${newData.path}`,
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
      message: "There's a problem when opening a stream instance.",
    };
  }
};
